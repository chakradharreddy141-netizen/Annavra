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
      const totalMacros = mealItems.reduce((acc, item) => ({
        calories: acc.calories + (Number(item.calories) || 0),
        protein_g: acc.protein_g + (Number(item.protein_g) || 0),
        carbs_g: acc.carbs_g + (Number(item.carbs_g) || 0),
        fat_g: acc.fat_g + (Number(item.fat_g) || 0),
        fiber_g: acc.fiber_g + (Number(item.fiber_g) || 0),
      }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });

      const result = await logMeal(mealItems, totalMacros);

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
        <Link href="/dashboard" className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#202433] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Scan Meal</h1>
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
            className="w-full aspect-square border-2 border-dashed border-[#2a2f42] rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#181b26] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-medium text-white group-hover:text-emerald-400 transition-colors">Take a Photo</p>
              <p className="text-sm mt-1">or upload from gallery</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-[#2a2f42]">
            <img src={imagePreview} alt="Meal preview" className="w-full h-full object-cover" />
            
            {!mealItems.length && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                {isScanning ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-sm font-medium text-emerald-400 animate-pulse">Analyzing meal...</p>
                  </div>
                ) : (
                  <button
                    onClick={handleScan}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
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
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-black/70 transition-colors"
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
                <h2 className="text-lg font-semibold text-white">Identified Items</h2>
                <span className="text-sm font-medium text-emerald-400">{totalCalories} kcal total</span>
              </div>
              
              <div className="space-y-3">
                {mealItems.map((item, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-[#181b26] border border-[#2a2f42] space-y-4 relative overflow-hidden group">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={item.food_name}
                          onChange={(e) => handleItemChange(index, 'food_name', e.target.value)}
                          className="w-full bg-transparent text-white font-semibold outline-none focus:border-b border-emerald-500/50 pb-1"
                          placeholder="Food name"
                        />
                        <div className="flex gap-2 text-sm text-gray-400">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-16 bg-transparent outline-none focus:text-white"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-24 bg-transparent outline-none focus:text-white"
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <input
                          type="number"
                          value={item.calories}
                          onChange={(e) => handleItemChange(index, 'calories', e.target.value)}
                          className="w-16 bg-transparent text-emerald-400 font-semibold text-right outline-none focus:border-b border-emerald-500/50 pb-1"
                        />
                        <span className="text-xs text-gray-500 ml-1">kcal</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#2a2f42]">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-gray-500 tracking-wider">Protein</p>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={item.protein_g}
                            onChange={(e) => handleItemChange(index, 'protein_g', e.target.value)}
                            className="w-10 bg-transparent text-sm text-white font-medium outline-none"
                          />
                          <span className="text-xs text-gray-400">g</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-gray-500 tracking-wider">Carbs</p>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={item.carbs_g}
                            onChange={(e) => handleItemChange(index, 'carbs_g', e.target.value)}
                            className="w-10 bg-transparent text-sm text-white font-medium outline-none"
                          />
                          <span className="text-xs text-gray-400">g</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-gray-500 tracking-wider">Fat</p>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={item.fat_g}
                            onChange={(e) => handleItemChange(index, 'fat_g', e.target.value)}
                            className="w-10 bg-transparent text-sm text-white font-medium outline-none"
                          />
                          <span className="text-xs text-gray-400">g</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleAddItem}
                className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-[#2a2f42] rounded-xl text-gray-400 hover:text-white hover:bg-[#181b26] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item Manually
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 mt-6 bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isSaving ? 'Saving Meal...' : 'Save Meal'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
