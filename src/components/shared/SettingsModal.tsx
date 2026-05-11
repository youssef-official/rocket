import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Sparkles, Save, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth, setLocalProfile } from '@/contexts/AuthContext';
import {
  PROVIDER_PRESETS, getAISettings, saveAISettings, getAvailableModels, type AISettings
} from '@/services/aiSettings';
import { toast } from '@/hooks/use-toast';

interface SettingsModalProps { isOpen: boolean; onClose: () => void; }

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();

  const [settings, setSettings] = useState<AISettings>(() => getAISettings());
  const [showKey, setShowKey] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [customModel, setCustomModel] = useState('');

  useEffect(() => { if (isOpen) setSettings(getAISettings()); }, [isOpen]);
  useEffect(() => { setDisplayName(user?.displayName || ''); }, [user]);

  const preset = PROVIDER_PRESETS.find(p => p.id === settings.providerId) || PROVIDER_PRESETS[0];
  const models = getAvailableModels(settings.providerId);

  const handleSelectProvider = (id: string) => {
    const p = PROVIDER_PRESETS.find(x => x.id === id);
    if (!p) return;
    setSettings(s => ({
      ...s,
      providerId: id,
      baseUrl: p.baseUrl || s.baseUrl,
      model: p.models[0] || s.model,
    }));
  };

  const handleSave = () => {
    if (!settings.apiKey.trim() && settings.providerId !== 'custom') {
      toast({ title: 'API Key required', description: 'Enter your provider API key.', variant: 'destructive' });
      return;
    }
    if (!settings.baseUrl.trim()) {
      toast({ title: 'Base URL required', description: 'Enter the API base URL.', variant: 'destructive' });
      return;
    }
    if (!settings.model.trim()) {
      toast({ title: 'Model required', description: 'Choose or type a model name.', variant: 'destructive' });
      return;
    }
    saveAISettings(settings);
    if (displayName !== user?.displayName) setLocalProfile({ displayName });
    toast({ title: 'Saved', description: 'AI provider settings updated.' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl bg-card border border-border"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Settings</h2>
                  <p className="text-xs text-muted-foreground">AI provider · Profile</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-72px)] space-y-5">
              {/* Profile */}
              <section>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your name</label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-2" placeholder="Your name" />
              </section>

              {/* Provider */}
              <section>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">AI Provider</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PROVIDER_PRESETS.map(p => (
                    <button key={p.id} type="button" onClick={() => handleSelectProvider(p.id)}
                      className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${settings.providerId === p.id ? 'bg-primary/10 border-primary/40 text-foreground' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {preset.notes && <p className="text-[11px] text-amber-500 mt-2">⚠ {preset.notes}</p>}
              </section>

              {/* Base URL */}
              <section>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Base URL</label>
                <Input value={settings.baseUrl} onChange={e => setSettings(s => ({ ...s, baseUrl: e.target.value }))}
                  placeholder="https://api.openai.com/v1" className="mt-2 font-mono text-xs" />
              </section>

              {/* API Key */}
              <section>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">API Key</label>
                <div className="relative mt-2">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type={showKey ? 'text' : 'password'} value={settings.apiKey}
                    onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                    placeholder="sk-..." className="pl-9 pr-10 font-mono text-xs" />
                  <button type="button" onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Stored locally in your browser only.</p>
              </section>

              {/* Model */}
              <section>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Model</label>
                {models.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {models.map(m => (
                      <button key={m} type="button" onClick={() => setSettings(s => ({ ...s, model: m }))}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-mono border transition-all ${settings.model === m ? 'bg-primary/15 border-primary/40 text-foreground' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Input value={settings.model} onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
                    placeholder="Or type any model id" className="font-mono text-xs" />
                </div>
              </section>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} className="gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Save
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
