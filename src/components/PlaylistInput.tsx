import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { extractPlaylistId } from '../utils/youtube';
import { storage, type RecentPlaylist } from '../utils/storage';
import { rememberPlaylist } from '../utils/recents';

interface Props {
  onSubmit: (url: string, id: string) => void;
}

export default function PlaylistInput({ onSubmit }: Props) {
  const [url, setUrl] = useState(storage.getUrl());
  const [error, setError] = useState('');
  // Read once on mount; returning from the player remounts this screen.
  const [recents] = useState<RecentPlaylist[]>(() => storage.getRecents());
  const reduce = useReducedMotion();

  function start(rawUrl: string, id: string) {
    setError('');
    storage.setUrl(rawUrl);
    rememberPlaylist(id, rawUrl);
    onSubmit(rawUrl, id);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    const id = extractPlaylistId(trimmed);
    if (!id) {
      setError('Not a playlist URL or ID.');
      return;
    }
    start(trimmed, id);
  }

  // One orchestrated page load: hairlines and blocks settle in sequence.
  const rise = {
    hidden: { opacity: 0, y: reduce ? 0 : 8 },
    show: { opacity: 1, y: 0 },
  };
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.055, delayChildren: 0.05 } },
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      {/* ── top meta strip ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
        <span className="label">YouTube playlist player</span>
        <span className="label hidden sm:inline">No account</span>
      </header>

      {/* ── poster ─────────────────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center px-4 py-10 sm:px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto w-full max-w-sm"
        >
          <motion.h1
            variants={rise}
            className="font-display text-[clamp(3.25rem,14vw,5rem)] font-semibold leading-[0.8] tracking-[-0.05em] text-paper"
          >
            son<span className="text-accent">a</span>
          </motion.h1>

          <motion.div variants={rise} className="mt-6 border-t border-line pt-3.5">
            <p className="max-w-[36ch] font-mono text-[0.6875rem] leading-relaxed text-muted">
              Paste any public playlist. Stop dropping frames, start gaining Elo.
            </p>
          </motion.div>

          <motion.form variants={rise} onSubmit={handleSubmit} className="mt-8">
            <label htmlFor="playlist-url" className="label block">
              Source
            </label>

            <input
              id="playlist-url"
              type="url"
              inputMode="url"
              autoFocus
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                setError('');
              }}
              placeholder="youtube.com/playlist?list=…"
              spellCheck={false}
              autoComplete="url"
              aria-invalid={!!error}
              aria-describedby={error ? 'playlist-error' : undefined}
              className="mt-1.5 w-full border-b border-line-strong bg-transparent py-2.5 font-mono text-base text-paper caret-accent sm:text-[0.75rem]
                         outline-none transition-colors duration-200 placeholder:text-ghost
                         hover:border-faint focus:border-accent"
            />

            {/* Reserved so the button never shifts when an error appears */}
            <div className="flex h-5 items-center">
              {error && (
                <p
                  id="playlist-error"
                  role="alert"
                  className="font-mono text-meta text-accent"
                >
                  <span aria-hidden="true" className="mr-2 text-faint">
                    ✕
                  </span>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="group mt-1 flex h-12 w-full items-center justify-between bg-accent px-4 text-ink
                         transition-[filter] duration-200 hover:brightness-110 active:brightness-90"
            >
              <span className="font-mono text-micro font-semibold uppercase tracking-label">
                Start playback
              </span>
              <ArrowRight
                size={14}
                strokeWidth={2.25}
                aria-hidden="true"
                className="transition-transform duration-200 ease-swiss group-hover:translate-x-1"
              />
            </button>
          </motion.form>

          {recents.length > 0 && (
            <motion.section variants={rise} className="mt-8 border-t border-line pt-3.5">
              <h2 className="label">Recently played</h2>

              <ul className="mt-1.5">
                {recents.map((r, i) => (
                  <li key={r.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      onClick={() => start(r.url, r.id)}
                      className="group flex w-full items-center gap-3 py-2.5 pr-1 text-left transition-colors duration-150 hover:bg-surface"
                    >
                      <span className="w-5 shrink-0 pl-0.5 font-mono text-micro tabular-nums text-ghost transition-colors duration-150 group-hover:text-accent">
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[0.75rem] leading-tight text-paper">
                          {r.title ?? r.id}
                        </span>
                        {r.author && (
                          <span className="mt-0.5 block truncate font-mono text-micro uppercase text-faint">
                            {r.author}
                          </span>
                        )}
                      </span>

                      <ArrowRight
                        size={12}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="shrink-0 text-ghost transition-all duration-200 ease-swiss group-hover:translate-x-0.5 group-hover:text-accent"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}
        </motion.div>
      </main>

      {/* ── bottom meta strip ──────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between border-t border-line px-4 py-3 sm:px-6">
        <ol className="flex gap-4">
          {['Paste', 'Play', 'Queue'].map((step, i) => (
            <li key={step} className="label">
              <span className="mr-1.5 text-ghost">{String(i + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
        <span className="label hidden sm:inline">Local only</span>
      </footer>
    </div>
  );
}
