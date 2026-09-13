"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, ScanLine, ArrowLeft, Loader2, Plus, Trash2, Check } from 'lucide-react';
import { logMeal } from './actions';
import Link from 'next/link';

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealItems, setMealItems] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setMealItems([]);
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!imageFile) return;
    setIsScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to scan image');
      }

      setMealItems(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...mealItems];
    updated[index][field] = field === 'food_name' || field === 'unit' ? value : Number(value);
    setMealItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...mealItems];
    updated.splice(index, 1);
    setMealItems(updated);
  };

  const handleAddItem = () => {
    setMealItems([
      ...mealItems,
      { food_name: '', quantity: 1, unit: 'serving', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
    ]);
  };

  const handleSave = async () => {
    if (mealItems.length === 0) return;
    setIsSaving(true);
    setError(null);

    try {
      const result = await logMeal(mealItems);

      if (result.error) {
        throw new Error(result.error);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  const totalCalories = mealItems.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-xl text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-[#1a1a1a] font-space">Scan Meal</h1>
        <div className="w-9" />
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {!imagePreview ? (
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square border-2 border-dashed border-[#1a1a1a]/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-[#6b7280] hover:text-[#ff4500] hover:border-[#1a1a1a]/10 hover:bg-[#ff4500]/10 transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#ff4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-[#ff4500] glow-cyan" />
            </div>
            <div className="text-center">
              <p className="font-medium text-[#1a1a1a] group-hover:text-[#ff4500] transition-colors">Take a Photo</p>
              <p className="text-sm mt-1 font-space">or upload from gallery</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-white/80 border border-[#1a1a1a]/10">
            <img src={imagePreview} alt="Meal preview" className="w-full h-full object-cover" />
            
            {!mealItems.length && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                {isScanning ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#ff4500] animate-spin" />
                    <p className="text-sm font-bold text-[#ff4500] animate-pulse glow-cyan font-space">Analyzing meal...</p>
                  </div>
                ) : (
                  <button
                    onClick={handleScan}
                    className="flex items-center gap-2 px-6 py-3 btn-cyber text-[#1a1a1a] rounded-xl font-bold transition-all active:scale-95"
                  >
                    <ScanLine className="w-5 h-5" />
                    Identify Food
                  </button>
                )}
              </div>
            )}
            
            {!isScanning && !mealItems.length && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-lg text-[#1a1a1a] hover:bg-white/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {mealItems.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-[#1a1a1a] font-space">Review AI Results</h2>
                <span className="text-sm font-bold text-[#ff4500] glow-cyan font-space">{totalCalories} kcal total</span>
              </div>
              
              <div className="space-y-3">
                {mealItems.map((item, index) => (
                  <div key={index} className="p-4 rounded-2xl cyber-panel space-y-4 relative overflow-hidden group">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={item.food_name}
                          onChange={(e) => handleItemChange(index, 'food_name', e.target.value)}
                          className="w-full bg-transparent text-[#1a1a1a] font-bold font-space outline-none focus:border-b border-[#1a1a1a]/10 pb-1"
                          placeholder="Food name"
                        />
                        <div className="flex gap-2 text-sm text-[#6b7280]">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-16 bg-transparent outline-none focus:text-[#ff4500]"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-24 bg-transparent outline-none focus:text-[#ff4500]"
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <input
                          type="number"
                          value={item.calories}
                          onChange={(e) => handleItemChange(index, 'calories', e.target.value)}
                          className="w-16 bg-transparent text-[#ff4500] font-bold font-space text-right outline-none focus:border-b border-[#1a1a1a]/10 pb-1"
                        />
                        <span className="text-xs text-[#6b7280] ml-1">kcal</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1a1a1a]/10">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-[#ff4500] tracking-wider">Protein</p>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={item.protein_g}
                            onChange={(e) => handleItemChange(index, 'protein_g', e.target.value)}
                            className="w-10 bg-transparent text-sm text-[#1a1a1a] font-medium outline-none"
                          />
                          <span className="text-xs text-[#6b7280]">g</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-[#1a1a1a] tracking-wider">Carbs</p>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={item.carbs_g}
                            onChange={(e) => handleItemChange(index, 'carbs_g', e.target.value)}
                            className="w-10 bg-transparent text-sm text-[#1a1a1a] font-medium outline-none"
                          />
                          <span className="text-xs text-[#6b7280]">g</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-[#10b981] tracking-wider">Fat</p>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={item.fat_g}
                            onChange={(e) => handleItemChange(index, 'fat_g', e.target.value)}
                            className="w-10 bg-transparent text-sm text-[#1a1a1a] font-medium outline-none"
                          />
                          <span className="text-xs text-[#6b7280]">g</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="absolute top-4 right-4 p-1.5 text-[#6b7280] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleAddItem}
                className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-[#1a1a1a]/10 rounded-xl text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 transition-colors font-space"
              >
                <Plus className="w-4 h-4" />
                Add Item Manually
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 mt-6 btn-cyber text-[#1a1a1a] rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 font-space"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isSaving ? 'Saving Meal...' : 'Confirm & Save Meal'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
