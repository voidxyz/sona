import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Toast } from '../hooks/useToast';

interface Props {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-px p-3"
    >
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout={!reduce}
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 border border-line-strong bg-surface px-3.5 py-2.5"
          >
            <span aria-hidden="true" className="font-mono text-micro text-accent">
              !
            </span>
            <span className="flex-1 font-mono text-meta leading-relaxed text-muted">
              {t.message}
            </span>
            <button
              onClick={() => onRemove(t.id)}
              aria-label="Dismiss notification"
              className="-mr-1 flex h-7 w-7 items-center justify-center text-ghost transition-colors duration-150 hover:text-paper"
            >
              <X size={13} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
