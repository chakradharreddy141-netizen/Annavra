'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calculateNutritionTargets } from '@/lib/nutrition/calculator';
import { Profile, Goal, FitnessGoal, ActivityLevel } from '@/lib/types/database';
import { 
  UserCircle, 
  Target, 
  Flame, 
  Scale, 
  RotateCcw, 
  Check, 
  History, 
  Calendar,
  Loader2,
  Droplets,
  Edit3,
  LogOut,
  Bell
} from 'lucide-react';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [goalHistory, setGoalHistory] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');

  // Recalculation Form State
  const [newWeight, setNewWeight] = useState<number>(72);
  const [newGoal, setNewGoal] = useState<FitnessGoal>('gain_muscle');
  const [newActivity, setNewActivity] = useState<ActivityLevel>('moderately_active');
  const [newTargetWeight, setNewTargetWeight] = useState<string>('');

  const fetchProfileData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Profile
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (p) {
      setProfile(p);
      setNewWeight(p.current_weight_kg || 72);
      setNewActivity(p.activity_level || 'moderately_active');
    }

    // Fetch Active Goal
    const { data: ag } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (ag) {
      setActiveGoal(ag);
      setNewWeight(ag.current_weight_kg);
      setNewGoal(ag.fitness_goal);
      if (ag.target_weight_kg) setNewTargetWeight(ag.target_weight_kg.toString());
    }

    // Fetch Goal History
    const { data: gh } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (gh) {
      setGoalHistory(gh);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission as any);
    }
  }, []);

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission as any);
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      setSuccessMsg('Push notifications enabled successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  };

  const handleRecalculateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setUpdating(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Calculate new targets
      const targets = calculateNutritionTargets({
        age: profile.age || 25,
        gender: profile.gender || 'male',
        height_cm: profile.height_cm || 175,
        weight_kg: newWeight,
        activity_level: newActivity,
        fitness_goal: newGoal,
        target_weight_kg: newTargetWeight ? parseFloat(newTargetWeight) : null,
        meals_per_day: profile.meals_per_day || 3,
      });

      // 1. Deactivate old active goal if exists
      if (activeGoal) {
        await supabase
          .from('goals')
          .update({
            is_active: false,
            effective_until: today,
          })
          .eq('id', activeGoal.id);
      }

      // 2. Insert new versioned goal row
      const { data: newGoalRow, error: insertGoalErr } = await supabase
        .from('goals')
        .insert({
          user_id: profile.id,
          fitness_goal: newGoal,
          target_weight_kg: newTargetWeight ? parseFloat(newTargetWeight) : null,
          current_weight_kg: newWeight,
          bmr: targets.bmr,
          tdee: targets.tdee,
          daily_calories: targets.daily_calories,
          daily_protein_g: targets.daily_protein_g,
          daily_carbs_g: targets.daily_carbs_g,
          daily_fat_g: targets.daily_fat_g,
          daily_fiber_g: targets.daily_fiber_g,
          daily_water_ml: targets.daily_water_ml,
          bmi: targets.bmi,
          bmi_category: targets.bmi_category,
          is_active: true,
          effective_from: today,
        })
        .select()
        .single();

      if (insertGoalErr) throw insertGoalErr;

      // 3. Update Meal Targets for new goal
      if (newGoalRow && targets.meal_targets.length > 0) {
        // Deactivate old meal targets
        await supabase
          .from('meal_targets')
          .update({ is_active: false })
          .eq('user_id', profile.id);

        // Insert new meal targets
        const newTargets = targets.meal_targets.map((mt) => ({
          goal_id: newGoalRow.id,
          user_id: profile.id,
          meal_number: mt.meal_number,
          meal_name: mt.meal_name,
          target_calories: mt.target_calories,
          target_protein_g: mt.target_protein_g,
          target_carbs_g: mt.target_carbs_g,
          target_fat_g: mt.target_fat_g,
          is_active: true,
        }));
        await supabase.from('meal_targets').insert(newTargets);
      }

      // 4. Record new weight entry
      await supabase.from('weight_entries').insert({
        user_id: profile.id,
        date: today,
        weight_kg: newWeight,
        notes: 'Recorded during goal target recalculation',
      });

      // 5. Update Profile activity level
      await supabase
        .from('profiles')
        .update({
          activity_level: newActivity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      setSuccessMsg('Targets recalculated successfully! Historical goals preserved.');
      setIsModalOpen(false);
      await fetchProfileData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error recalculating targets');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] tracking-tight">Profile & Goals</h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">
            Manage your physiological stats, target versioning, and preferences.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#333] text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Recalculate Targets
        </button>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          className="px-4 py-2.5 rounded-xl bg-[#fafafa] hover:bg-red-500/10 border border-[#1a1a1a]/10 hover:border-red-500/30 text-[#6b7280] hover:text-red-400 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-[#ff4500]/10 border border-[#ff4500]/30 text-[#ff4500] text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bio Details */}
        <div className="bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-[#1a1a1a]/10 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ff4500]/10 border border-[#ff4500]/20 flex items-center justify-center font-black text-[#ff4500] text-xl">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="font-bold text-base text-[#1a1a1a]">{profile?.name || 'Athlete'}</h2>
              <div className="text-xs text-[#6b7280]">{profile?.email}</div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#1a1a1a]/10">
              <span className="text-[#6b7280]">Age</span>
              <span className="text-[#1a1a1a] font-medium">{profile?.age || '--'} yrs</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1a1a1a]/10">
              <span className="text-[#6b7280]">Gender</span>
              <span className="text-[#1a1a1a] font-medium capitalize">{profile?.gender || '--'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1a1a1a]/10">
              <span className="text-[#6b7280]">Height</span>
              <span className="text-[#1a1a1a] font-medium">{profile?.height_cm || '--'} cm</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1a1a1a]/10">
              <span className="text-[#6b7280]">Current Weight</span>
              <span className="text-[#1a1a1a] font-medium">{activeGoal?.current_weight_kg || '--'} kg</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1a1a1a]/10">
              <span className="text-[#6b7280]">Activity Level</span>
              <span className="text-[#1a1a1a] font-medium capitalize">{profile?.activity_level?.replace('_', ' ') || '--'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#6b7280]">Dietary Style</span>
              <span className="text-[#1a1a1a] font-medium capitalize">{profile?.dietary_preference?.replace('_', ' ') || '--'}</span>
            </div>
          </div>
        </div>

        {/* Current Active Goal Breakdown */}
        <div className="md:col-span-2 bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#ff4500]" />
              <h2 className="font-bold text-base text-[#1a1a1a]">Active Nutrition Target</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#ff4500]/10 border border-[#ff4500]/30 text-[#ff4500] font-bold text-[10px] uppercase tracking-wider">
              Active Since {activeGoal?.effective_from || 'Today'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10">
              <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Calories</div>
              <div className="text-lg font-black text-[#ff4500] mt-0.5">{activeGoal?.daily_calories} <span className="text-xs text-[#6b7280] font-normal">kcal</span></div>
            </div>
            <div className="p-3 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10">
              <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Protein</div>
              <div className="text-lg font-black text-[#1a1a1a] mt-0.5">{activeGoal?.daily_protein_g} <span className="text-xs text-[#6b7280] font-normal">g</span></div>
            </div>
            <div className="p-3 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10">
              <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Carbs</div>
              <div className="text-lg font-black text-[#1a1a1a] mt-0.5">{activeGoal?.daily_carbs_g} <span className="text-xs text-[#6b7280] font-normal">g</span></div>
            </div>
            <div className="p-3 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10">
              <div className="text-[10px] text-[#6b7280] uppercase font-semibold">Fat</div>
              <div className="text-lg font-black text-[#1a1a1a] mt-0.5">{activeGoal?.daily_fat_g} <span className="text-xs text-[#6b7280] font-normal">g</span></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10">
              <span className="text-[#6b7280]">BMR / TDEE</span>
              <div className="font-bold text-[#1a1a1a] mt-0.5">{activeGoal?.bmr} / {activeGoal?.tdee} kcal</div>
            </div>
            <div className="p-3 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10">
              <span className="text-[#6b7280]">BMI Category</span>
              <div className="font-bold text-[#1a1a1a] mt-0.5">{activeGoal?.bmi} ({activeGoal?.bmi_category})</div>
            </div>
            <div className="p-3 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10">
              <span className="text-[#6b7280]">Water / Fiber</span>
              <div className="font-bold text-[#1a1a1a] mt-0.5">{((activeGoal?.daily_water_ml || 2500) / 1000).toFixed(1)}L / {activeGoal?.daily_fiber_g}g</div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Versioning History (Section 4 & 16 Requirement) */}
      <div className="bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#ff4500]" />
          <h2 className="text-base font-bold text-[#1a1a1a]">Target Version History (10+ Year Preserved)</h2>
        </div>
        <p className="text-xs text-[#6b7280]">
          When your weight or fitness goals change, previous targets remain permanently tied to their respective date windows rather than overwriting past performance.
        </p>

        <div className="space-y-2 mt-4">
          {goalHistory.map((g, idx) => (
            <div
              key={g.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                g.is_active
                  ? 'bg-[#ff4500]/5 border-[#ff4500]/30'
                  : 'bg-[#fafafa] border-[#1a1a1a]/10'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1a1a1a] capitalize">{g.fitness_goal.replace('_', ' ')}</span>
                  {g.is_active && (
                    <span className="px-2 py-0.5 rounded-full bg-[#ff4500] text-white font-bold text-[9px]">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="text-[#6b7280] text-[11px] mt-0.5">
                  Weight: {g.current_weight_kg} kg &bull; Active: {g.effective_from} {g.effective_until ? `to ${g.effective_until}` : 'to Present'}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[#1a1a1a]">
                <div><strong className="text-[#ff4500]">{g.daily_calories}</strong> kcal</div>
                <div><strong className="text-[#1a1a1a]">{g.daily_protein_g}g</strong> P</div>
                <div><strong className="text-[#1a1a1a]">{g.daily_carbs_g}g</strong> C</div>
                <div><strong className="text-[#1a1a1a]">{g.daily_fat_g}g</strong> F</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications Section */}
      <div className="bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#ff4500]" />
          <h2 className="text-base font-bold text-[#1a1a1a]">Notifications</h2>
        </div>
        <p className="text-xs text-[#6b7280]">
          Enable push notifications to receive workout reminders and logging nudges.
        </p>
        <button
          onClick={subscribeToPush}
          disabled={pushStatus === 'granted'}
          className="w-full sm:w-auto px-6 py-3 rounded-xl btn-cyber text-[#1a1a1a] font-bold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pushStatus === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
        </button>
      </div>

      {/* Recalculate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">Recalculate Nutrition Targets</h3>
              <p className="text-xs text-[#6b7280] mt-1">
                Enter your updated weight or change your goal. A new versioned record will be archived without modifying past tracking history.
              </p>
            </div>

            <form onSubmit={handleRecalculateAndSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1a1a1a] mb-1">New Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10 text-[#1a1a1a] text-sm focus:border-[#ff4500] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Fitness Goal</label>
                <select
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value as FitnessGoal)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10 text-[#1a1a1a] text-sm focus:border-[#ff4500] outline-none"
                >
                  <option value="lose_fat">Lose Fat (20% Deficit)</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain_muscle">Gain Muscle (10% Surplus)</option>
                  <option value="gain_weight">Gain Weight (15% Surplus)</option>
                  <option value="improve_fitness">General Fitness</option>
                  <option value="improve_strength">Strength & Performance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Activity Level</label>
                <select
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value as ActivityLevel)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10 text-[#1a1a1a] text-sm focus:border-[#ff4500] outline-none"
                >
                  <option value="sedentary">Sedentary (Desk job)</option>
                  <option value="lightly_active">Lightly Active (1-2 days/wk)</option>
                  <option value="moderately_active">Moderately Active (3-5 days/wk)</option>
                  <option value="very_active">Very Active (6-7 days/wk)</option>
                  <option value="extremely_active">Extremely Active (Athletic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Target Weight (kg) - Optional</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTargetWeight}
                  onChange={(e) => setNewTargetWeight(e.target.value)}
                  placeholder="e.g. 78"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10 text-[#1a1a1a] text-sm focus:border-[#ff4500] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1a1a1a]/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#fafafa] hover:bg-[#ebebeb] text-[#1a1a1a] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-[#ff4500] hover:bg-[#e63e00] disabled:opacity-50 text-gray-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Version Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
