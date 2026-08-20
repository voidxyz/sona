import { motion, useReducedMotion } from 'framer-motion';

/**
 * A small decorative mark pinned to the bottom-right corner. Purely
 * ornamental — aria-hidden, pointer-events-none, and sits below the toast
 * layer so it never blocks a message or a control.
 */
export default function Nunu() {
  const reduce = useReducedMotion();

  return (
    <motion.img
      src="/nunu.gif"
      alt=""
      aria-hidden="true"
      draggable={false}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed bottom-3 right-3 z-30 w-14 select-none sm:bottom-4 sm:right-4 sm:w-[4.5rem]"
    />
  );
}
