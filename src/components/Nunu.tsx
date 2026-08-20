import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

/**
 * The corner mark, and the app's only theme switch — clicking it flips the
 * page between the near-black and white palettes. Sits below the toast layer
 * so it never covers a message.
 */
export default function Nunu() {
  const reduce = useReducedMotion();
  const { theme, toggle } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'light'}
      aria-label={theme === 'light' ? 'Switch to dark background' : 'Switch to white background'}
      title={theme === 'light' ? 'Dark background' : 'White background'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileTap={{ scale: reduce ? 1 : 0.92 }}
      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-3 right-3 z-30 w-14 cursor-pointer sm:bottom-4 sm:right-4 sm:w-[4.5rem]"
    >
      <img src="/nunu.gif" alt="" aria-hidden="true" draggable={false} className="w-full select-none" />
    </motion.button>
  );
}
