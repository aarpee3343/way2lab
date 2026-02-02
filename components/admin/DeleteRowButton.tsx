'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { useRouter } from 'next/navigation';

interface DeleteRowButtonProps {
  id: number;
  deleteAction: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export default function DeleteRowButton({ id, deleteAction }: DeleteRowButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const res = await deleteAction(id);
      if (res.success) {
        toast.success('Deleted successfully');
        router.refresh(); // Refresh the page data
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading}
      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
      title="Delete"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  );
}