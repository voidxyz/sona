import { X } from 'lucide-react';
import type { Toast } from '../hooks/useToast';

interface Props {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-4 py-3 rounded-lg shadow-xl pointer-events-auto"
        >
          <span className="text-cyan-400 font-mono text-xs mr-1">!</span>
          <span>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="text-zinc-700 hover:text-zinc-400 transition-colors ml-1"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
