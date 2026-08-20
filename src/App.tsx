import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import PlaylistInput from './components/PlaylistInput';
import Player from './components/Player';
import Nunu from './components/Nunu';
import { useTitleMeter } from './hooks/useTitleMeter';

export default function App() {
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useTitleMeter();

  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {playlistId ? (
          <motion.div key="player" {...fade}>
            <Player playlistId={playlistId} onBack={() => setPlaylistId(null)} />
          </motion.div>
        ) : (
          <motion.div key="input" {...fade}>
            <PlaylistInput onSubmit={(_url, id) => setPlaylistId(id)} />
          </motion.div>
        )}
      </AnimatePresence>

      <Nunu />
    </>
  );
}
