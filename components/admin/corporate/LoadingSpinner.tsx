import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="admin-loading">
      <Loader2 className="animate-spin" size={16} /> {text}
    </div>
  );
}
