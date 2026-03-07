import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Repeat, X, Plus, Heart, Trash2, ChevronDown, GripVertical, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Track {
  id: string;
  title: string;
  url: string;
  favorite: boolean;
}

interface PlayerPosition {
  x: number;
  y: number;
}

const POSITION_KEY = 'vivora_music_position';
const HIDDEN_KEY = 'vivora_music_hidden';
const PLAYING_KEY = 'vivora_music_playing';

const loadPosition = (): PlayerPosition => {
  try {
    const saved = localStorage.getItem(POSITION_KEY);
    return saved ? JSON.parse(saved) : { x: 16, y: 16 };
  } catch { return { x: 16, y: 16 }; }
};

const savePosition = (pos: PlayerPosition) => {
  localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
};

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ── Hook: Cloud-synced playlist ──
function useCloudPlaylist() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [repeatMode, setRepeatMode] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load from DB on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('user_playlists')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        const dbTracks = (data.tracks as unknown as Track[]) || [];
        setTracks(dbTracks);
        setCurrentIndex(data.current_index || 0);
        setVolume(Number(data.volume) || 0.7);
        setRepeatMode(data.repeat_mode || false);
        setSynced(true);
      }
    };
    load();
  }, [user]);

  // Debounced save to DB
  const saveToCloud = useCallback((t: Track[], idx: number, vol: number, rep: boolean) => {
    if (!user) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSyncing(true);
      await supabase.from('user_playlists').upsert(
        {
          user_id: user.id,
          tracks: JSON.parse(JSON.stringify(t)),
          current_index: idx,
          volume: vol,
          repeat_mode: rep,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'user_id' }
      );
      setSynced(true);
      setSyncing(false);
    }, 1500);
  }, [user]);

  const updateTracks = useCallback((newTracks: Track[]) => {
    setTracks(newTracks);
    saveToCloud(newTracks, currentIndex, volume, repeatMode);
  }, [currentIndex, volume, repeatMode, saveToCloud]);

  const updateIndex = useCallback((idx: number) => {
    setCurrentIndex(idx);
    saveToCloud(tracks, idx, volume, repeatMode);
  }, [tracks, volume, repeatMode, saveToCloud]);

  const updateVolume = useCallback((vol: number) => {
    setVolume(vol);
    saveToCloud(tracks, currentIndex, vol, repeatMode);
  }, [tracks, currentIndex, repeatMode, saveToCloud]);

  const updateRepeat = useCallback((rep: boolean) => {
    setRepeatMode(rep);
    saveToCloud(tracks, currentIndex, volume, rep);
  }, [tracks, currentIndex, volume, saveToCloud]);

  return {
    tracks, setTracks: updateTracks,
    currentIndex, setCurrentIndex: updateIndex,
    volume, setVolume: updateVolume,
    repeatMode, setRepeatMode: updateRepeat,
    synced, syncing,
  };
}

// ── Main Floating Player ──
export const FloatingMusicPlayer: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem(PLAYING_KEY) === 'true');
  const [isHidden, setIsHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === 'true');
  const [expanded, setExpanded] = useState(false);
  const {
    tracks, setTracks,
    currentIndex, setCurrentIndex,
    volume, setVolume,
    repeatMode, setRepeatMode,
    synced, syncing,
  } = useCloudPlaylist();

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState<PlayerPosition>(loadPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { savePosition(position); }, [position]);
  useEffect(() => { localStorage.setItem(HIDDEN_KEY, isHidden ? 'true' : 'false'); }, [isHidden]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'open') {
        setIsEnabled(true);
        localStorage.setItem(PLAYING_KEY, 'true');
        setExpanded(true);
        setIsHidden(false);
      }
    };
    window.addEventListener('vivora-music-toggle', handler);
    return () => window.removeEventListener('vivora-music-toggle', handler);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const currentTrack = tracks[currentIndex];

  const playTrackAt = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setTimeout(() => {
      if (audioRef.current && tracks[idx]) {
        audioRef.current.src = tracks[idx].url;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 50);
  }, [tracks, setCurrentIndex]);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src || audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url;
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    playTrackAt((currentIndex + 1) % tracks.length);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    playTrackAt(currentIndex === 0 ? tracks.length - 1 : currentIndex - 1);
  };

  const handleEnded = () => { repeatMode ? audioRef.current?.play() : nextTrack(); };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const addTrack = (url: string, title: string) => {
    const newTrack: Track = { id: Date.now().toString(), title, url, favorite: false };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (id: string) => setTracks(tracks.filter(t => t.id !== id));

  const toggleFavorite = (id: string) =>
    setTracks(tracks.map(t => t.id === id ? { ...t, favorite: !t.favorite } : t));

  const closePlayer = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setIsEnabled(false);
    setExpanded(false);
    setIsHidden(false);
    localStorage.setItem(PLAYING_KEY, 'false');
  };

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, [data-no-drag]')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };
    const up = () => setIsDragging(false);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  }, [isDragging, dragOffset]);

  // Touch drag for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, [data-no-drag]')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e: TouchEvent) => {
      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(window.innerWidth - 60, touch.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };
    const end = () => setIsDragging(false);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
    return () => { document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end); };
  }, [isDragging, dragOffset]);

  if (!isEnabled) return null;

  return (
    <>
      <audio ref={audioRef} onEnded={handleEnded} onTimeUpdate={handleTimeUpdate} />

      {/* Hidden mini toggle */}
      <AnimatePresence>
        {isHidden && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 9999, cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}
          >
            <button onClick={() => setIsHidden(false)}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/40 flex items-center justify-center hover:shadow-xl transition-all relative">
              <Music className="w-4.5 h-4.5 text-white" />
              {isPlaying && (
                <motion.div className="absolute inset-0 rounded-full border-2 border-white/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }} />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main container */}
      {!isHidden && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 9998, cursor: isDragging ? 'grabbing' : 'default' }}
          className="select-none touch-none"
        >
          <AnimatePresence mode="wait">
            {!expanded ? (
              /* ── Mini Player ── */
              <motion.div key="mini" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}
                className="flex items-center gap-2 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-full px-2 py-1.5 shadow-2xl shadow-black/50 cursor-grab active:cursor-grabbing"
              >
                {/* Album art */}
                <button onClick={() => setExpanded(true)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-white/10 flex items-center justify-center relative flex-shrink-0">
                  <Music className="w-4 h-4 text-violet-300" />
                  {isPlaying && (
                    <svg className="absolute inset-0 w-9 h-9 -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="2" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(139,92,246,0.8)" strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 15}`}
                        strokeDashoffset={`${2 * Math.PI * 15 * (1 - progress / 100)}`}
                        strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                {/* Track info */}
                <div className="max-w-[120px] hidden sm:block">
                  <p className="text-[11px] text-white/80 truncate font-medium">{currentTrack?.title || 'No track'}</p>
                </div>

                {/* Mini controls */}
                <div className="flex items-center gap-0.5">
                  <button onClick={prevTrack} className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={togglePlay} disabled={tracks.length === 0}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30">
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <button onClick={nextTrack} className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── Expanded Panel ── */
              <motion.div key="expanded"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="w-[340px] max-w-[calc(100vw-2rem)] bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
              >
                {/* Drag handle */}
                <div className="flex items-center justify-between px-4 py-2.5 cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-white/20" />
                    <span className="text-xs font-semibold text-white/70">Music Player</span>
                    {/* Sync indicator */}
                    {syncing ? (
                      <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                    ) : synced ? (
                      <Cloud className="w-3 h-3 text-green-400/60" />
                    ) : (
                      <CloudOff className="w-3 h-3 text-white/20" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setExpanded(false)} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
                      <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                    </button>
                    <button onClick={() => { setExpanded(false); setIsHidden(true); }}
                      className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
                      <Music className="w-3 h-3 text-white/40" />
                    </button>
                    <button onClick={closePlayer} className="w-6 h-6 rounded-lg hover:bg-red-500/20 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-white/40" />
                    </button>
                  </div>
                </div>

                <ExpandedPlayer
                  tracks={tracks} currentIndex={currentIndex} isPlaying={isPlaying}
                  togglePlay={togglePlay} nextTrack={nextTrack} prevTrack={prevTrack}
                  volume={volume} setVolume={setVolume}
                  repeatMode={repeatMode} setRepeatMode={setRepeatMode}
                  progress={progress} currentTime={currentTime} duration={duration}
                  handleSeek={handleSeek}
                  addTrack={addTrack} removeTrack={removeTrack} toggleFavorite={toggleFavorite}
                  playTrack={playTrackAt}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
};

// ── Expanded Player Panel ──
interface ExpandedPlayerProps {
  tracks: Track[]; currentIndex: number; isPlaying: boolean;
  togglePlay: () => void; nextTrack: () => void; prevTrack: () => void;
  volume: number; setVolume: (v: number) => void;
  repeatMode: boolean; setRepeatMode: (r: boolean) => void;
  progress: number; currentTime: number; duration: number;
  handleSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  addTrack: (url: string, title: string) => void;
  removeTrack: (id: string) => void; toggleFavorite: (id: string) => void;
  playTrack: (idx: number) => void;
}

const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({
  tracks, currentIndex, isPlaying, togglePlay, nextTrack, prevTrack,
  volume, setVolume, repeatMode, setRepeatMode,
  progress, currentTime, duration, handleSeek,
  addTrack, removeTrack, toggleFavorite, playTrack,
}) => {
  const [tab, setTab] = useState<'player' | 'playlist'>('player');
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const currentTrack = tracks[currentIndex];
  const favorites = tracks.filter(t => t.favorite);

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    addTrack(newUrl.trim(), newTitle.trim() || `Track ${tracks.length + 1}`);
    setNewUrl(''); setNewTitle(''); setShowAdd(false);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] mx-4">
        {(['player', 'playlist'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              tab === t ? 'text-violet-400 border-b-2 border-violet-400' : 'text-white/30 hover:text-white/50'
            }`}>
            {t === 'playlist' ? `Playlist (${tracks.length})` : 'Now Playing'}
          </button>
        ))}
      </div>

      {tab === 'player' && (
        <div className="p-5">
          {/* Album visual */}
          <div className="flex items-center justify-center mb-5">
            <motion.div
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={isPlaying ? { duration: 8, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center relative"
            >
              <div className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-violet-400" />
              </div>
              {/* Vinyl grooves */}
              <div className="absolute inset-3 rounded-full border border-white/[0.04]" />
              <div className="absolute inset-6 rounded-full border border-white/[0.04]" />
              <div className="absolute inset-8 rounded-full border border-white/[0.04]" />
            </motion.div>
          </div>

          {/* Track info */}
          <div className="text-center mb-4">
            <p className="text-sm font-semibold text-white/90 truncate">{currentTrack?.title || 'No track selected'}</p>
            <p className="text-[11px] text-white/30 mt-1">
              {tracks.length > 0 ? `${currentIndex + 1} of ${tracks.length}` : 'Add tracks to start'}
            </p>
          </div>

          {/* ── Timeline Seek Bar ── */}
          <div className="mb-5">
            <div data-no-drag className="w-full h-2 bg-white/[0.06] rounded-full cursor-pointer group relative" onClick={handleSeek}>
              <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all relative"
                style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg shadow-violet-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-white/30 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <button onClick={() => setRepeatMode(!repeatMode)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${repeatMode ? 'bg-violet-500/20 text-violet-400' : 'text-white/25 hover:text-white/50'}`}>
              <Repeat className="w-4 h-4" />
            </button>
            <button onClick={prevTrack} className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/60 transition-all">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={togglePlay} disabled={tracks.length === 0}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 flex items-center justify-center text-white shadow-xl shadow-violet-500/30 transition-all disabled:opacity-30 active:scale-95">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <button onClick={nextTrack} className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/60 transition-all">
              <SkipForward className="w-4 h-4" />
            </button>
            <button onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/25 hover:text-white/50 transition-all">
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Volume slider */}
          <div data-no-drag className="flex items-center gap-3 px-2">
            <Volume2 className="w-3 h-3 text-white/20 flex-shrink-0" />
            <input type="range" min="0" max="1" step="0.02" value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="flex-1 h-1 bg-white/[0.06] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:cursor-pointer" />
            <span className="text-[10px] text-white/20 w-7 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {tab === 'playlist' && (
        <div className="p-3">
          {/* Add Track */}
          <button onClick={() => setShowAdd(!showAdd)}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 text-xs font-medium transition-colors border border-dashed border-white/[0.08]">
            <Plus className="w-3.5 h-3.5" /> Add Track
          </button>

          <AnimatePresence>
            {showAdd && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
                <div className="space-y-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <input data-no-drag value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Track title..."
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-white/20 outline-none focus:border-violet-500/40" />
                  <input data-no-drag value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="MP3 URL..."
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-white/20 outline-none focus:border-violet-500/40 font-mono" />
                  <button onClick={handleAdd} disabled={!newUrl.trim()}
                    className="w-full py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-30">
                    Add to Playlist
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Track list */}
          <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
            {tracks.length === 0 && (
              <p className="text-center text-white/20 text-xs py-8">No tracks yet. Add an MP3 URL to start.</p>
            )}
            {tracks.map((track, idx) => (
              <div key={track.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  idx === currentIndex ? 'bg-violet-500/10 border border-violet-500/20' : 'hover:bg-white/[0.03] border border-transparent'
                }`}
                onClick={() => playTrack(idx)}>
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  {idx === currentIndex && isPlaying ? (
                    <div className="flex items-end gap-[2px] h-3">
                      {[1, 2, 3].map(i => (
                        <motion.div key={i} className="w-[2px] bg-violet-400 rounded-full"
                          animate={{ height: ['3px', '10px', '3px'] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-white/30 font-mono">{idx + 1}</span>
                  )}
                </div>
                <span className="text-xs text-white/70 truncate flex-1 font-medium">{track.title}</span>
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <Heart className={`w-3 h-3 ${track.favorite ? 'fill-pink-400 text-pink-400' : 'text-white/15'}`} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
                  <Trash2 className="w-3 h-3 text-white/15 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Favorites section */}
          {favorites.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2 px-1">♥ Favorites</p>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {favorites.map(track => {
                  const idx = tracks.findIndex(t => t.id === track.id);
                  return (
                    <div key={track.id} onClick={() => playTrack(idx)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer ${idx === currentIndex ? 'bg-violet-500/10' : ''}`}>
                      <Heart className="w-3 h-3 fill-pink-400 text-pink-400 flex-shrink-0" />
                      <span className="text-xs text-white/60 truncate flex-1">{track.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
