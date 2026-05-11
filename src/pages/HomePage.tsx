import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Sparkles, Plus, Mic, MicOff, Palette, Check, Cpu, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { UserMenuDropdown } from '@/components/UserMenuDropdown';
import { SettingsModal } from '@/components/SettingsModal';
import { saveProject, getProjects, deleteProject, newId, type LocalProject } from '@/lib/storage';
import { getAIConfig, getAvailableModels } from '@/lib/aiProviders';
import { toast } from 'sonner';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const MAX_PROMPT_LENGTH = 100000;

const COLOR_THEMES = [
  { name: 'Default', colors: ['#4F46E5', '#818CF8', '#C7D2FE'] },
  { name: 'Glacier', colors: ['#0EA5E9', '#38BDF8', '#BAE6FD'] },
  { name: 'Harvest', colors: ['#F59E0B', '#FBBF24', '#FDE68A'] },
  { name: 'Lavender', colors: ['#A855F7', '#C084FC', '#E9D5FF'] },
  { name: 'Brutalist', colors: ['#1F2937', '#6B7280', '#F9FAFB'] },
  { name: 'Obsidian', colors: ['#0F172A', '#334155', '#94A3B8'] },
  { name: 'Orchid', colors: ['#EC4899', '#F472B6', '#FBCFE8'] },
  { name: 'Solar', colors: ['#EF4444', '#F97316', '#FCD34D'] },
  { name: 'Forest', colors: ['#059669', '#34D399', '#A7F3D0'] },
  { name: 'Coral', colors: ['#F43F5E', '#FB7185', '#FECDD3'] },
];

const TYPING_WORDS = ['a dashboard', 'a landing page', 'an e-commerce store', 'a portfolio', 'a blog'];
const FRAMEWORKS = ['React', 'Next.js', 'HTML', 'Vue', 'Svelte'];

export function HomePage() {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState(() => localStorage.getItem('vivora_home_prompt') || '');
  const [selectedFramework, setSelectedFramework] = useState('React');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projects, setProjects] = useState<LocalProject[]>([]);

  // Models
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showModelMenu, setShowModelMenu] = useState(false);

  // Theme
  const [selectedTheme, setSelectedTheme] = useState<{ name: string; colors: string[] } | null>(() => {
    const saved = sessionStorage.getItem('vivora_selected_theme');
    return saved ? JSON.parse(saved) : null;
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  // Typing animation
  const [typingIndex, setTypingIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Voice
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const plusButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProjects(getProjects());
    const cfg = getAIConfig();
    const avail = getAvailableModels();
    setModels(avail);
    setSelectedModel(localStorage.getItem('vivora_selected_model') || cfg?.model || avail[0] || '');
  }, [settingsOpen]);

  useEffect(() => { if (selectedModel) localStorage.setItem('vivora_selected_model', selectedModel); }, [selectedModel]);
  useEffect(() => { localStorage.setItem('vivora_home_prompt', prompt); }, [prompt]);
  useEffect(() => {
    if (selectedTheme) sessionStorage.setItem('vivora_selected_theme', JSON.stringify(selectedTheme));
    else sessionStorage.removeItem('vivora_selected_theme');
  }, [selectedTheme]);

  // Typing animation
  useEffect(() => {
    const word = TYPING_WORDS[typingIndex];
    const speed = isDeleting ? 50 : 100;
    const t = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < word.length) setDisplayText(word.slice(0, displayText.length + 1));
        else setTimeout(() => setIsDeleting(true), 2000);
      } else {
        if (displayText.length > 0) setDisplayText(word.slice(0, displayText.length - 1));
        else { setIsDeleting(false); setTypingIndex((p) => (p + 1) % TYPING_WORDS.length); }
      }
    }, speed);
    return () => clearTimeout(t);
  }, [displayText, isDeleting, typingIndex]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Speech recognition not supported'); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || 'en-US';
    r.onresult = (e: any) => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      if (e.results[e.resultIndex]?.isFinal) setPrompt((p) => p + txt + ' ');
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const cfg = getAIConfig();
    if (!cfg || !cfg.apiKey) {
      toast.error('Configure your AI provider first');
      setSettingsOpen(true);
      return;
    }
    const id = newId();
    const project: LocalProject = {
      id,
      name: prompt.slice(0, 60),
      description: prompt,
      files: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProject(project);
    sessionStorage.setItem(`pending_prompt_${id}`, prompt);
    if (selectedModel) sessionStorage.setItem(`pending_model_${id}`, selectedModel);
    if (selectedFramework) sessionStorage.setItem(`pending_framework_${id}`, selectedFramework);
    localStorage.removeItem('vivora_home_prompt');
    navigate(`/project/${id}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    deleteProject(id);
    setProjects(getProjects());
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden text-white"
      style={{ backgroundImage: `url(${spaceHeroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 pointer-events-none" />

      {/* Header */}
      <header className="relative z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Vivora <span className="opacity-60">Local</span></span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/70">OSS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/[0.14] transition-all text-sm font-medium"
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </button>
            <UserMenuDropdown onOpenSettings={() => setSettingsOpen(true)} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-col items-center px-4 md:px-6 pt-12 md:pt-20 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/10 text-xs text-white/70"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          100% Local · Bring your own API key
        </motion.div>

        {/* Hero title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mb-10"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-5">
            Build anything <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">with AI</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 font-light">
            Start with{' '}
            <span className="text-white font-medium">{displayText}</span>
            <span className="inline-block w-0.5 h-5 bg-white/80 align-middle ml-0.5 animate-pulse" />
          </p>
        </motion.div>

        {/* Prompt box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-3xl"
        >
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 border border-white/20 overflow-hidden">
              <textarea
                value={prompt}
                onChange={(e) => e.target.value.length <= MAX_PROMPT_LENGTH && setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(e as any); }
                }}
                placeholder="Describe what you want to build..."
                className="w-full px-6 py-5 text-gray-800 placeholder:text-gray-400 bg-transparent border-0 outline-none resize-none min-h-[110px] text-base"
              />

              <div className="flex items-center justify-between px-3 md:px-5 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {/* Model chip */}
                  <button
                    type="button"
                    onClick={() => setShowModelMenu((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-700 hover:bg-amber-500/20 transition whitespace-nowrap max-w-[180px]"
                  >
                    <Cpu className="w-3 h-3" />
                    <span className="truncate">{selectedModel || 'No model'}</span>
                  </button>

                  <AnimatePresence>
                    {showModelMenu && (
                      <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setShowModelMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute mt-12 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-[9999]"
                        >
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Models</p>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {models.length === 0 && (
                              <button type="button" onClick={() => { setShowModelMenu(false); setSettingsOpen(true); }} className="w-full px-4 py-3 text-sm text-amber-600 font-semibold hover:bg-amber-50 text-left">
                                + Configure provider in Settings
                              </button>
                            )}
                            {models.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => { setSelectedModel(m); setShowModelMenu(false); }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 ${selectedModel === m ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-700'}`}
                              >
                                <span className="truncate">{m}</span>
                                {selectedModel === m && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  {/* Plus / themes */}
                  <div className="relative" ref={plusButtonRef}>
                    <button
                      type="button"
                      onClick={() => setShowPlusMenu((v) => !v)}
                      className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition group"
                      title="More"
                    >
                      <Plus className={`w-5 h-5 text-gray-500 group-hover:text-gray-700 transition ${showPlusMenu ? 'rotate-45' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showPlusMenu && (
                        <>
                          <div className="fixed inset-0 z-[9998]" onClick={() => setShowPlusMenu(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-12 left-0 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-[9999]"
                          >
                            <button
                              type="button"
                              onClick={() => { setShowPlusMenu(false); setShowThemeMenu(true); }}
                              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Palette className="w-4 h-4 text-indigo-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-700">Color Theme</p>
                                <p className="text-[11px] text-gray-500">Pick a palette</p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowPlusMenu(false); setSettingsOpen(true); }}
                              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left border-t border-gray-100"
                            >
                              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                <SettingsIcon className="w-4 h-4 text-amber-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-700">AI Settings</p>
                                <p className="text-[11px] text-gray-500">Provider & API key</p>
                              </div>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {showThemeMenu && (
                        <>
                          <div className="fixed inset-0 z-[9998]" onClick={() => setShowThemeMenu(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-12 left-0 w-60 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-[9999] max-h-80 overflow-y-auto"
                          >
                            <div className="px-4 py-2.5 border-b border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Themes</p>
                            </div>
                            {COLOR_THEMES.map((theme) => (
                              <button
                                key={theme.name}
                                type="button"
                                onClick={() => {
                                  setSelectedTheme(theme.name === 'Default' ? null : theme);
                                  setShowThemeMenu(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${(selectedTheme?.name === theme.name || (!selectedTheme && theme.name === 'Default')) ? 'bg-indigo-50' : ''}`}
                              >
                                <div className="flex -space-x-1.5">
                                  {theme.colors.map((c, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{theme.name}</span>
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTheme && (
                    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                      <div className="flex -space-x-1">
                        {selectedTheme.colors.map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span>{selectedTheme.name}</span>
                      <button type="button" onClick={() => setSelectedTheme(null)} className="w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center">
                        <X className="w-2.5 h-2.5 text-gray-600" />
                      </button>
                    </div>
                  )}
                  <span className={`hidden md:inline text-[10px] font-mono tabular-nums ${prompt.length >= MAX_PROMPT_LENGTH ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {prompt.length}/{MAX_PROMPT_LENGTH}
                  </span>
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gray-100 hover:bg-gray-200'}`}
                    title={isListening ? 'Stop' : 'Voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-gray-500" />}
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    disabled={!prompt.trim()}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition disabled:opacity-40 shadow-lg ${prompt.trim() ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30' : 'bg-gray-200'}`}
                  >
                    <ArrowRight className={`w-4 h-4 ${prompt.trim() ? 'text-white' : 'text-gray-500'}`} />
                  </motion.button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Frameworks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 w-full max-w-3xl"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FRAMEWORKS.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFramework(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${selectedFramework === f ? 'bg-white text-black border-white' : 'bg-white/[0.06] border-white/15 text-white/70 hover:bg-white/[0.12]'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Projects */}
        {projects.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 w-full max-w-5xl"
          >
            <h3 className="text-sm uppercase tracking-wider text-white/50 mb-4 font-semibold">Your projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="group relative p-4 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/10 hover:bg-white/[0.10] hover:border-white/20 cursor-pointer transition"
                >
                  <div className="font-semibold truncate mb-1">{p.name}</div>
                  <div className="text-xs text-white/50">{new Date(p.updatedAt).toLocaleString()}</div>
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-300" />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

export default HomePage;
