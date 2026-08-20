import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Six equaliser bars across three braille cells — each cell is a 2x4 dot grid,
 * so its two columns render two independent bars filling from the bottom.
 * The loop is built so no bar moves more than one level per frame and the last
 * frame flows back into the first, which is what keeps it reading as motion
 * rather than noise.
 */
const FRAMES = [
  '⣼⣷⣄', '⣾⣦⣄', '⣿⣄⣀', '⣷⣠⣠', '⣷⣴⣠', '⣦⣾⣴',
  '⣄⣷⣾', '⣄⣦⣾', '⣀⣄⣿', '⣠⣠⣷', '⣠⣴⣷', '⣴⣾⣦',
] as const;

/** Neutral resting state: all six bars at half height. */
const STILL = '⣤⣤⣤';

const PREFIX = 'sona';
const SUFFIX = 'playlist player';
const INTERVAL = 180;

/**
 * Animates the separator in the tab title into a looping level meter. Held
 * still when the user prefers reduced motion — a flickering tab title is
 * motion they can't scroll away from.
 */
export function useTitleMeter() {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      document.title = `${PREFIX} ${STILL} ${SUFFIX}`;
      return;
    }

    let frame = 0;
    const tick = () => {
      document.title = `${PREFIX} ${FRAMES[frame]} ${SUFFIX}`;
      frame = (frame + 1) % FRAMES.length;
    };

    tick();
    const timer = setInterval(tick, INTERVAL);
    return () => clearInterval(timer);
  }, [reduce]);
}
