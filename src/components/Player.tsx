import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { ArrowLeft, Music } from 'lucide-react';
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
  playVideoAt(index: number): void;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<YTPlayer | null>(null);
  const videoIdsRef = useRef<string[]>([]);
  const playOrderRef = useRef<number[]>([]);
  const posRef = useRef(0);
  const repeatRef = useRef<RepeatMode>('off');
  const fetchedRef = useRef<Set<string>>(new Set());

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
    playerRef.current.playVideoAt(order[newPos]);
    updatePos(newPos);
    setProgress(0);
    setDuration(0);
    setThumbFailed(false);
    prefetchMeta(newPos);
  }

  function goNext() {
    const nextPos = posRef.current + 1;
    if (nextPos >= playOrderRef.current.length) {
      if (repeatRef.current === 'all') navigateTo(0);
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
  function initPlaylist(ids: string[]) {
    videoIdsRef.current = ids;
    const order = ids.map((_, i) => i);
    updatePlayOrder(order);
    setVideoIds(ids);
    const startIdx = playerRef.current?.getPlaylistIndex?.() ?? 0;
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
      setIsPlaying(true);
      const playerIdx = event.target.getPlaylistIndex?.() ?? -1;
      if (playerIdx >= 0) {
        const posInOrder = playOrderRef.current.indexOf(playerIdx);
        if (posInOrder !== -1 && posInOrder !== posRef.current) {
          updatePos(posInOrder);
          prefetchMeta(posInOrder);
        }
      }
      const vd = event.target.getVideoData?.();
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
      } catch {}
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // ── Controls ──────────────────────────────────────────────────────────────
  function togglePlay() {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
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
    setShuffle(next);
    const currentOrigIdx = playOrderRef.current[posRef.current];

    if (next) {
      const others = playOrderRef.current.filter((_, i) => i !== posRef.current);
      const newOrder = [currentOrigIdx, ...shuffleArray(others)];
      updatePlayOrder(newOrder);
      updatePos(0);
      prefetchMeta(0);
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

  function jumpToQueue(queueIndex: number) {
    navigateTo(pos + 1 + queueIndex);
  }

  // ── Derived display values ────────────────────────────────────────────────
  const currentOrigIdx = playOrder[pos] ?? 0;
  const currentVideoId = videoIds[currentOrigIdx] ?? '';
  const currentMeta = meta.get(currentVideoId);
  const upcomingIds = playOrder.slice(pos + 1).map(i => videoIds[i]).filter(Boolean);
  const thumbUrl = currentVideoId ? getThumbnail(currentVideoId) : '';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-zinc-700 hover:text-zinc-400 transition-colors text-xs tracking-wide"
        >
          <ArrowLeft size={14} />
          <span>Change playlist</span>
        </button>
        <span className="text-xs font-bold tracking-tighter text-zinc-800">
          son<span className="text-cyan-900">a</span>
        </span>
        <div className="w-28" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-6 pb-8 gap-6 max-w-sm mx-auto w-full">
        {/* Album art */}
        <div className="w-full aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-zinc-900 mt-2">
          {currentVideoId && !thumbFailed ? (
            <img
              key={currentVideoId}
              src={thumbUrl}
              alt={currentMeta?.title ?? ''}
              className="w-full h-full object-cover"
              onError={() => setThumbFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={48} className="text-zinc-900" />
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="w-full text-center">
          <h2 className="text-base font-semibold text-white leading-snug line-clamp-2 tracking-tight">
            {currentMeta?.title ?? (currentVideoId ? 'Loading…' : 'Waiting for playlist…')}
          </h2>
          <p className="text-sm text-zinc-500 mt-1 truncate">
            {currentMeta?.author ?? ''}
          </p>
          {videoIds.length > 0 && (
            <p className="text-xs text-zinc-800 mt-1 font-mono">
              {pos + 1} / {playOrder.length}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <ProgressBar progress={progress} duration={duration} onSeek={handleSeek} />

        {/* Controls */}
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

        {/* Queue */}
        <Queue
          open={queueOpen}
          onToggle={() => setQueueOpen(o => !o)}
          upcomingIds={upcomingIds}
          meta={meta}
          onJump={jumpToQueue}
        />
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
