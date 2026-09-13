'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteWorkout } from './actions';

export default function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    const result = await deleteWorkout(workoutId);
    
    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
    }
    // On success, Next.js revalidatePath will refresh the UI, so we don't need to do anything else.
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-[#6b7280] hover:text-red-500 transition-colors bg-[#ffffff] border border-[#1a1a1a]/10 hover:border-red-500/30 rounded-lg active:scale-95"
      title="Delete Workout"
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
