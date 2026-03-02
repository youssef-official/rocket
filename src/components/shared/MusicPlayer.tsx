import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Repeat, X, Plus, Heart, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';

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

const STORAGE_KEY = 'vivora_music_playlist';
const PLAYING_KEY = 'vivora_music_playing';
const POSITION_KEY = 'vivora_music_position';
const HIDDEN_KEY = 'vivora_music_hidden';

const loadPlaylist = (): Track[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const savePlaylist = (tracks: Track[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
};

const loadPosition = (): PlayerPosition => {
  try {
    const saved = localStorage.getItem(POSITION_KEY);
    return saved ? JSON.parse(saved) : { x: 16, y: 16 };
  } catch { return { x: 16, y: 16 }; }
};

const savePosition = (pos: PlayerPosition) => {
  localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
};

// Floating mini player that appears on all pages
export const FloatingMusicPlayer: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem(PLAYING_KEY) === 'true');
  const [isHidden, setIsHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === 'true');
  const [expanded, setExpanded] = useState(false);
  const [tracks, setTracks] = useState<Track[]>(loadPlaylist);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState<PlayerPosition>(loadPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { savePlaylist(tracks); }, [tracks]);

  useEffect(() => {
    savePosition(position);
  }, [position]);

  useEffect(() => {
    localStorage.setItem(HIDDEN_KEY, isHidden ? 'true' : 'false');
  }, [isHidden]);

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
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const currentTrack = tracks[currentIndex];

  const playTrack = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    audioRef.current.src = currentTrack.url;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [currentTrack]);

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
    const next = (currentIndex + 1) % tracks.length;
    setCurrentIndex(next);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = tracks[next].url;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 100);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    const prev = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    setCurrentIndex(prev);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = tracks[prev].url;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 100);
  };

  const handleEnded = () => {
    if (repeat) {
      audioRef.current?.play();
    } else {
      nextTrack();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const addTrack = (url: string, title: string) => {
    const newTrack: Track = { id: Date.now().toString(), title, url, favorite: false };
    setTracks(prev => [...prev, newTrack]);
  };

  const removeTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, favorite: !t.favorite } : t));
  };

  const closePlayer = () => {
    if (audioRef.current) { audioRef.current.pause(); }
    setIsPlaying(false);
    setIsEnabled(false);
    setExpanded(false);
    setIsHidden(false);
    localStorage.setItem(PLAYING_KEY, 'false');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isEnabled) return null;

  return (
    <>
      <audio ref={audioRef} onEnded={handleEnded} onTimeUpdate={handleTimeUpdate} />
      
      {/* Draggable Mini Toggle - when hidden */}
      <AnimatePresence>
        {isHidden && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              zIndex: 9999,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
          >
            <button
              onClick={() => setIsHidden(false)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-purple-500/40 transition-all"
              title="Show Music Player"
            >
              <Music className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Player Container */}
      <motion.div
        ref={playerRef}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9998,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className="select-none"
      >
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.button
              key="mini"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onMouseDown={handleMouseDown}
              onClick={() => setExpanded(true)}
              className="relative w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/30 flex items-center justify-center group hover:bg-white/15 transition-all"
            >
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-purple-400/50"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <Music className="w-5 h-5 text-white/80" />
              {/* Progress ring */}
              {isPlaying && (
                <svg className="absolute inset-0 w-12 h-12 -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="2" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(168,85,247,0.8)" strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                    strokeLinecap="round" />
                </svg>
              )}
            </motion.button>
          ) : (
            <MusicPanel
              tracks={tracks}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              isPlaying={isPlaying}
              togglePlay={togglePlay}
              nextTrack={nextTrack}
              prevTrack={prevTrack}
              volume={volume}
              setVolume={setVolume}
              muted={muted}
              setMuted={setMuted}
              repeat={repeat}
              setRepeat={setRepeat}
              progress={progress}
              addTrack={addTrack}
              removeTrack={removeTrack}
              toggleFavorite={toggleFavorite}
              onCollapse={() => setExpanded(false)}
              onClose={closePlayer}
              onHide={() => setIsHidden(true)}
              onMouseDown={handleMouseDown}
              isDragging={isDragging}
              playTrack={(idx: number) => {
                setCurrentIndex(idx);
                setTimeout(() => {
                  if (audioRef.current) {
                    audioRef.current.src = tracks[idx].url;
                    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                }, 100);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

interface MusicPanelProps {
  tracks: Track[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  volume: number;
  setVolume: (v: number) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  repeat: boolean;
  setRepeat: (r: boolean) => void;
  progress: number;
  addTrack: (url: string, title: string) => void;
  removeTrack: (id: string) => void;
  toggleFavorite: (id: string) => void;
  onCollapse: () => void;
  onClose: () => void;
  onHide: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  playTrack: (idx: number) => void;
}

const MusicPanel: React.FC<MusicPanelProps> = ({
  tracks, currentIndex, isPlaying, togglePlay, nextTrack, prevTrack,
  volume, setVolume, muted, setMuted, repeat, setRepeat, progress,
  addTrack, removeTrack, toggleFavorite, onCollapse, onClose, onHide, onMouseDown, isDragging, playTrack,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<'player' | 'playlist' | 'favorites'>('player');
  const currentTrack = tracks[currentIndex];

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    addTrack(newUrl.trim(), newTitle.trim() || `Track ${tracks.length + 1}`);
    setNewUrl('');
    setNewTitle('');
    setShowAdd(false);
  };

  const favorites = tracks.filter(t => t.favorite);

  return (
    <motion.div
      key="expanded"
      initial={{ scale: 0.8, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      transition={{ type: 'spring', damping: 25 }}
      onMouseDown={onMouseDown}
      className={`w-80 bg-black/60 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden ${isDragging ? 'opacity-80' : ''}`}
    >
      {/* Header - Draggable */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-grab active:cursor-grabbing" onMouseDown={onMouseDown}>
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white/90">Music</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onHide} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors" title="Hide Player">
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </button>
          <button onClick={onCollapse} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors" title="Collapse">
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Close">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['player', 'playlist', 'favorites'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${tab === t ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/40 hover:text-white/60'}`}>
            {t === 'favorites' ? `♥ (${favorites.length})` : t === 'playlist' ? `List (${tracks.length})` : t}
          </button>
        ))}
      </div>

      {tab === 'player' && (
        <div className="p-4">
          {/* Now Playing */}
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center mb-3">
              <Music className="w-7 h-7 text-purple-400" />
            </div>
            <p className="text-xs font-medium text-white/80 truncate">
              {currentTrack?.title || 'No track selected'}
            </p>
            <p className="text-[11px] text-white/40 mt-0.5">
              {tracks.length > 0 ? `${currentIndex + 1} / ${tracks.length}` : 'Add tracks to start'}
            </p>
          </div>

          {/* Progress */}
          <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button onClick={() => setRepeat(!repeat)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${repeat ? 'bg-purple-500/20 text-purple-400' : 'text-white/30 hover:text-white/60'}`}>
              <Repeat className="w-4 h-4" />
            </button>
            <button onClick={prevTrack} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={togglePlay} disabled={tracks.length === 0}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 transition-all disabled:opacity-30">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
            <button onClick={() => setMuted(!muted)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 px-2">
            <Volume2 className="w-3 h-3 text-white/30" />
            <input type="range" min="0" max="1" step="0.05" value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:cursor-pointer" />
          </div>
        </div>
      )}

      {tab === 'playlist' && (
        <div className="p-3">
          <button onClick={() => setShowAdd(!showAdd)}
            className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium transition-colors border border-dashed border-white/10">
            <Plus className="w-3.5 h-3.5" /> Add Track
          </button>

          <AnimatePresence>
            {showAdd && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2">
                <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/10">
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Track title..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/40" />
                  <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="MP3 URL..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/20 outline-none focus:border-purple-500/40 font-mono" />
                  <button onClick={handleAdd} disabled={!newUrl.trim()}
                    className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-30">
                    Add to Playlist
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {tracks.length === 0 && (
              <p className="text-center text-white/30 text-xs py-6">No tracks yet</p>
            )}
            {tracks.map((track, idx) => (
              <div key={track.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${idx === currentIndex ? 'bg-purple-500/15 border border-purple-500/20' : 'hover:bg-white/5'}`}
                onClick={() => playTrack(idx)}>
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  {idx === currentIndex && isPlaying ? (
                    <div className="flex items-end gap-[2px] h-3">
                      {[1, 2, 3].map(i => (
                        <motion.div key={i} className="w-[3px] bg-purple-400 rounded-full"
                          animate={{ height: ['4px', '12px', '4px'] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                      ))}
                    </div>
                  ) : (
                    <Music className="w-3 h-3 text-white/40" />
                  )}
                </div>
                <span className="text-xs text-white/80 truncate flex-1">{track.title}</span>
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                  className="p-1 hover:bg-white/10 rounded transition-colors">
                  <Heart className={`w-3 h-3 ${track.favorite ? 'fill-pink-400 text-pink-400' : 'text-white/20'}`} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors">
                  <Trash2 className="w-3 h-3 text-white/20 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'favorites' && (
        <div className="p-3">
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {favorites.length === 0 && (
              <p className="text-center text-white/30 text-xs py-6">No favorites yet</p>
            )}
            {favorites.map((track) => {
              const idx = tracks.findIndex(t => t.id === track.id);
              return (
                <div key={track.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${idx === currentIndex ? 'bg-purple-500/15' : ''}`}
                  onClick={() => playTrack(idx)}>
                  <Heart className="w-3 h-3 fill-pink-400 text-pink-400 flex-shrink-0" />
                  <span className="text-xs text-white/80 truncate flex-1">{track.title}</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-white/30 text-[10px]">
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};
