import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ListPlus } from 'lucide-react';
import Controls, { type RepeatMode } from './Controls';
import ProgressBar from './ProgressBar';
import Queue from './Queue';
import ToastContainer from './Toast';
import { useToast } from '../hooks/useToast';
import { getThumbnail, fetchVideoMeta, shuffleArray } from '../utils/youtube';
import { storage } from '../utils/storage';

// YouTube IFrame API player states (numeric constants avoid the UMD global issue)
const PS = { ENDED: 0, PLAYING: 1, PAUSED: 2 } as const;

interface VideoMeta {
  title: string;
  author: string;
}

// Minimal player interface covering the methods we call
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  loadVideoById(videoId: string): void;
  getPlaylist(): string[];
  getPlaylistIndex(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoData(): { video_id: string; title: string; author: string };
}

interface Props {
  playlistId: string;
  onBack: () => void;
}

export default function Player({ playlistId, onBack }: Props) {
  // ── Mutable refs for stable callback access ──────────────────────────────
  const playerRef = useRef<YTPlayer | null>(null);
  const videoIdsRef = useRef<string[]>([]);
  const playOrderRef = useRef<number[]>([]);
  const posRef = useRef(0);
  const repeatRef = useRef<RepeatMode>('off');
  const fetchedRef = useRef<Set<string>>(new Set());
  const shuffleRef = useRef(false);
  // The track we asked the player to play. YouTube's native playlist mode
  // auto-advances sequentially on its own; anything else gets corrected.
  const expectedIdRef = useRef<string | null>(null);
  const correctionsRef = useRef(0);
  // Original indices in the order they actually played (unique) — the
  // current shuffle cycle. Shuffle never re-queues anything in here.
  const playedRef = useRef<number[]>([]);

  // ── React state (drives UI) ───────────────────────────────────────────────
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [playOrder, setPlayOrder] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(storage.getVolume());
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [meta, setMeta] = useState<Map<string, VideoMeta>>(new Map());
  const [queueOpen, setQueueOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const { toasts, addToast, removeToast } = useToast();
  const reduce = useReducedMotion();

  // ── Helpers to sync refs + state together ────────────────────────────────
  function updatePos(newPos: number) {
    posRef.current = newPos;
    setPos(newPos);
  }

  function updatePlayOrder(order: number[]) {
    playOrderRef.current = order;
    setPlayOrder(order);
  }

  // ── Metadata fetch (idempotent) ───────────────────────────────────────────
  async function prefetchMeta(fromPos: number) {
    const ids = videoIdsRef.current;
    const order = playOrderRef.current;
    const toFetch = new Set<string>();
    for (let i = fromPos; i < Math.min(fromPos + 8, order.length); i++) {
      const id = ids[order[i]];
      if (id && !fetchedRef.current.has(id)) {
        toFetch.add(id);
        fetchedRef.current.add(id);
      }
    }
    for (const id of toFetch) {
      fetchVideoMeta(id).then(m => {
        if (m) setMeta(prev => new Map(prev).set(id, m));
      });
    }
  }

  // ── Navigation (uses refs — always fresh, never stale) ───────────────────
  function navigateTo(newPos: number) {
    const order = playOrderRef.current;
    const ids = videoIdsRef.current;
    if (!playerRef.current || !ids.length || newPos < 0 || newPos >= order.length) return;
    const id = ids[order[newPos]];
    expectedIdRef.current = id;
    correctionsRef.current = 0;
    // loadVideoById takes the player out of native playlist mode, so YouTube
    // stops auto-advancing in its own (sequential) order.
    playerRef.current.loadVideoById(id);
    updatePos(newPos);
    setProgress(0);
    setDuration(0);
    setThumbFailed(false);
    prefetchMeta(newPos);
  }

  // Fresh shuffled cycle over every track, never opening with `avoidIdx`
  // (the track that just played) so the wrap-around can't repeat it.
  function freshShuffle(avoidIdx: number | undefined) {
    const order = shuffleArray(videoIdsRef.current.map((_, i) => i));
    if (order.length > 1 && order[0] === avoidIdx) {
      const j = 1 + Math.floor(Math.random() * (order.length - 1));
      [order[0], order[j]] = [order[j], order[0]];
    }
    return order;
  }

  function goNext() {
    const nextPos = posRef.current + 1;
    if (nextPos >= playOrderRef.current.length) {
      if (repeatRef.current !== 'all') return;
      playedRef.current = [];
      if (shuffleRef.current) {
        updatePlayOrder(freshShuffle(playOrderRef.current[posRef.current]));
      }
      navigateTo(0);
    } else {
      navigateTo(nextPos);
    }
  }

  function goPrev() {
    // If >3s in, restart; otherwise go to previous track
    if (progress > 3 && playerRef.current) {
      playerRef.current.seekTo(0, true);
      setProgress(0);
      return;
    }
    const prevPos = posRef.current - 1;
    if (prevPos < 0) {
      if (repeatRef.current === 'all') navigateTo(playOrderRef.current.length - 1);
    } else {
      navigateTo(prevPos);
    }
  }

  // ── Init playlist from player ─────────────────────────────────────────────
  function initPlaylist(rawIds: string[]) {
    // Playlists can contain the same video more than once — keep one copy
    const ids = [...new Set(rawIds)];
    videoIdsRef.current = ids;
    const order = ids.map((_, i) => i);
    updatePlayOrder(order);
    setVideoIds(ids);
    const rawStart = playerRef.current?.getPlaylistIndex?.() ?? 0;
    const startIdx = Math.max(0, ids.indexOf(rawIds[rawStart] ?? ids[0]));
    expectedIdRef.current = ids[startIdx];
    playedRef.current = [startIdx];
    if (shuffleRef.current) {
      // Shuffle was switched on before the playlist arrived
      updatePlayOrder([startIdx, ...shuffleArray(order.filter(i => i !== startIdx))]);
      updatePos(0);
      prefetchMeta(0);
      return;
    }
    updatePos(startIdx);
    prefetchMeta(startIdx);
  }

  function tryGetPlaylist(retries = 8) {
    const ids = playerRef.current?.getPlaylist?.() ?? [];
    if (ids.length > 0) {
      initPlaylist(ids);
    } else if (retries > 0) {
      setTimeout(() => tryGetPlaylist(retries - 1), 400);
    }
  }

  // ── YouTube player event handlers ─────────────────────────────────────────
  function handleReady(event: { target: YTPlayer }) {
    playerRef.current = event.target;
    playerRef.current.setVolume(storage.getVolume());
    setTimeout(() => tryGetPlaylist(), 600);
  }

  function handleStateChange(event: { data: number; target: YTPlayer }) {
    const state = event.data;

    if (state === PS.PLAYING) {
      const vd = event.target.getVideoData?.();
      const expected = expectedIdRef.current;

      // YouTube went somewhere we didn't send it (native auto-advance) — pull it back
      if (vd?.video_id && expected && vd.video_id !== expected && correctionsRef.current < 2) {
        correctionsRef.current++;
        event.target.loadVideoById(expected);
        return;
      }
      correctionsRef.current = 0;
      setIsPlaying(true);

      const origIdx = videoIdsRef.current.indexOf(vd?.video_id ?? '');
      if (origIdx !== -1 && !playedRef.current.includes(origIdx)) {
        playedRef.current.push(origIdx);
      }

      if (vd?.video_id) {
        setMeta(prev => new Map(prev).set(vd.video_id, {
          title: vd.title ?? vd.video_id,
          author: vd.author ?? '',
        }));
      }
    } else if (state === PS.PAUSED) {
      setIsPlaying(false);
    } else if (state === PS.ENDED) {
      setIsPlaying(false);
      if (repeatRef.current === 'one') {
        playerRef.current?.seekTo(0, true);
        playerRef.current?.playVideo();
      } else {
        goNext();
      }
    }
  }

  function handleError(event: { data: number }) {
    const code = event.data;
    // 101 / 150 = not embeddable; 100 = not found/private
    if (code === 101 || code === 150 || code === 100) {
      const currentId = videoIdsRef.current[playOrderRef.current[posRef.current]];
      const m = meta.get(currentId);
      const label = m?.title ? `"${m.title}"` : 'A video';
      addToast(`${label} can't be embedded — skipping`);
      setTimeout(() => goNext(), 600);
    }
  }

  // ── Progress polling ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      if (!playerRef.current) return;
      try {
        setProgress(playerRef.current.getCurrentTime?.() ?? 0);
        setDuration(playerRef.current.getDuration?.() ?? 0);
      } catch {
        // player torn down between ticks — next poll recovers
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // ── Controls ──────────────────────────────────────────────────────────────
  function togglePlay() {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }

  function handleSeek(seconds: number) {
    playerRef.current?.seekTo(seconds, true);
    setProgress(seconds);
  }

  function handleVolumeChange(v: number) {
    setVolumeState(v);
    playerRef.current?.setVolume(v);
    storage.setVolume(v);
  }

  function toggleShuffle() {
    const next = !shuffle;
    shuffleRef.current = next;
    setShuffle(next);
    const currentOrigIdx = playOrderRef.current[posRef.current];
    if (currentOrigIdx === undefined) return; // initPlaylist applies it once loaded

    if (next) {
      // Already-played tracks become history (reachable via prev), the rest
      // gets shuffled. Nothing from this cycle is queued a second time.
      let history = playedRef.current.filter(i => i !== currentOrigIdx);
      let remaining = videoIdsRef.current
        .map((_, i) => i)
        .filter(i => i !== currentOrigIdx && !history.includes(i));
      if (remaining.length === 0) {
        // Whole playlist already heard — start a new cycle from here
        history = [];
        remaining = videoIdsRef.current.map((_, i) => i).filter(i => i !== currentOrigIdx);
        playedRef.current = [currentOrigIdx];
      }
      updatePlayOrder([...history, currentOrigIdx, ...shuffleArray(remaining)]);
      updatePos(history.length);
      prefetchMeta(history.length);
    } else {
      const sequential = videoIdsRef.current.map((_, i) => i);
      updatePlayOrder(sequential);
      updatePos(currentOrigIdx);
      prefetchMeta(currentOrigIdx);
    }
  }

  function cycleRepeat() {
    const next: RepeatMode = repeat === 'off' ? 'one' : repeat === 'one' ? 'all' : 'off';
    repeatRef.current = next;
    setRepeat(next);
  }

  // Hand the track off to youtube.com, where the user's own session can save it
  // to a playlist. Doing this in-app would need OAuth + a verified Google app.
  function saveToYouTube() {
    const id = videoIdsRef.current[playOrderRef.current[posRef.current]];
    if (!id) return;
    const win = window.open(
      `https://www.youtube.com/watch?v=${id}`,
      '_blank',
      'noopener,noreferrer'
    );
    if (!win) addToast('Allow pop-ups to open this track on YouTube');
  }

  function jumpToQueue(queueIndex: number) {
    const target = posRef.current + 1 + queueIndex;
    if (shuffleRef.current && queueIndex > 0) {
      // Play it next instead of skipping over the tracks in between,
      // so they still come up in this cycle
      const order = [...playOrderRef.current];
      const [picked] = order.splice(target, 1);
      order.splice(posRef.current + 1, 0, picked);
      updatePlayOrder(order);
      navigateTo(posRef.current + 1);
    } else {
      navigateTo(target);
    }
  }

  // ── Derived display values ────────────────────────────────────────────────
  const currentOrigIdx = playOrder[pos] ?? 0;
  const currentVideoId = videoIds[currentOrigIdx] ?? '';
  const currentMeta = meta.get(currentVideoId);
  const upcomingIds = playOrder.slice(pos + 1).map(i => videoIds[i]).filter(Boolean);
  const thumbUrl = currentVideoId ? getThumbnail(currentVideoId) : '';
  const seekPct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const statusLabel = !currentVideoId ? 'Standby' : isPlaying ? 'Now playing' : 'Paused';

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-paper">
      {/* Hidden YouTube player — 1×1px, opacity 0, not display:none */}
      <div
        style={{
          position: 'fixed', bottom: 0, right: 0,
          width: 1, height: 1, opacity: 0,
          pointerEvents: 'none', overflow: 'hidden',
        }}
      >
        <YouTube
          opts={{
            width: '1',
            height: '1',
            playerVars: {
              autoplay: 1,
              listType: 'playlist',
              list: playlistId,
              controls: 0,
              disablekb: 1,
              iv_load_policy: 3,
              modestbranding: 1,
              rel: 0,
              origin: window.location.origin,
            },
          }}
          onReady={handleReady}
          onStateChange={handleStateChange}
          onError={handleError}
        />
      </div>

      {/* Playhead as a full-bleed hairline across the top of the viewport */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-40 h-px origin-left bg-accent"
        style={{ transform: `scaleX(${seekPct / 100})` }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-faint transition-colors duration-150 hover:text-paper"
        >
          <ArrowLeft
            size={12}
            strokeWidth={1.75}
            aria-hidden="true"
            className="transition-transform duration-200 ease-swiss group-hover:-translate-x-1"
          />
          <span className="label transition-colors duration-150 group-hover:text-paper">
            Change playlist
          </span>
        </button>

        <span className="font-display text-xs font-semibold tracking-[-0.03em] text-faint">
          son<span className="text-accent-dim">a</span>
        </span>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pb-8 sm:px-6">
        {/* status row */}
        <div className="flex h-9 items-center justify-between border-b border-line">
          <span className="flex items-center gap-2">
            <motion.span
              aria-hidden="true"
              className={`h-1 w-1 ${isPlaying ? 'bg-accent' : 'bg-ghost'}`}
              animate={isPlaying && !reduce ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="label">{statusLabel}</span>
          </span>

          {videoIds.length > 0 && (
            <span className="font-mono text-meta tabular-nums text-muted">
              {String(pos + 1).padStart(2, '0')}
              <span className="mx-1.5 text-ghost">/</span>
              {String(playOrder.length).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* artwork */}
        <div className="relative mt-5 aspect-square w-full overflow-hidden border border-line bg-surface">
          <AnimatePresence initial={false}>
            {currentVideoId && !thumbFailed ? (
              <motion.img
                key={currentVideoId}
                src={thumbUrl}
                alt={currentMeta?.title ? `Artwork for ${currentMeta.title}` : ''}
                initial={{ opacity: 0, scale: reduce ? 1 : 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => setThumbFailed(true)}
              />
            ) : (
              <div
                key="placeholder"
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="label text-ghost">
                  {currentVideoId ? 'No artwork' : 'Loading playlist'}
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* track info — title block, with the save action beside it */}
        <div className="mt-5 flex min-h-[3.25rem] items-start gap-2">
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentVideoId || 'empty'}
                initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -4 }}
                transition={{ duration: reduce ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="line-clamp-2 font-display text-[0.9375rem] font-medium leading-[1.35] tracking-[-0.01em] text-paper">
                  {currentMeta?.title ?? (currentVideoId ? 'Loading…' : 'Waiting for playlist')}
                </h1>
                {currentMeta?.author && (
                  <p className="mt-1.5 truncate font-mono text-micro uppercase text-faint">
                    {currentMeta.author}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Hands the track to youtube.com, where the user's own session saves it */}
          <button
            onClick={saveToYouTube}
            disabled={!currentVideoId}
            aria-label="Open on YouTube to save to a playlist"
            className="-mr-2 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-faint
                       transition-colors duration-150 hover:text-paper
                       disabled:pointer-events-none disabled:text-ghost"
          >
            <ListPlus size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* transport */}
        <div className="mt-3.5">
          <ProgressBar progress={progress} duration={duration} onSeek={handleSeek} />
        </div>

        <Controls
          isPlaying={isPlaying}
          shuffle={shuffle}
          repeat={repeat}
          volume={volume}
          onTogglePlay={togglePlay}
          onNext={goNext}
          onPrev={goPrev}
          onToggleShuffle={toggleShuffle}
          onCycleRepeat={cycleRepeat}
          onVolumeChange={handleVolumeChange}
        />

        <div className="mt-5">
          <Queue
            open={queueOpen}
            onToggle={() => setQueueOpen(o => !o)}
            upcomingIds={upcomingIds}
            meta={meta}
            onJump={jumpToQueue}
          />
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
