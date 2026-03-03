import React, { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff, AlertCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Secret {
  key: string;
  value: string;
}

interface SecretsPanelProps {
  projectId: string | undefined;
}

export const SecretsPanel: React.FC<SecretsPanelProps> = ({ projectId }) => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const storageKey = `project_secrets_${projectId}`;

  useEffect(() => {
    if (!projectId) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setSecrets(JSON.parse(saved));
    } catch { /* empty */ }
  }, [projectId, storageKey]);

  const save = useCallback((updated: Secret[]) => {
    setSecrets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [storageKey]);

  const addSecret = () => {
    const key = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!key || !newValue.trim()) return;
    if (secrets.some(s => s.key === key)) return;
    save([...secrets, { key, value: newValue.trim() }]);
    setNewKey('');
    setNewValue('');
  };

  const removeSecret = (key: string) => {
    save(secrets.filter(s => s.key !== key));
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Key className="w-4 h-4 text-yellow-500" />
        <h3 className="text-sm font-semibold text-foreground">Secrets & Environment</h3>
      </div>

      {/* Warning */}
      <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
          Secrets are stored locally and injected as <code className="font-mono bg-yellow-500/10 px-1 rounded">VITE_*</code> env variables. 
          The AI can read and use them during code generation.
        </p>
      </div>

      {/* Add New */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <input
          value={newKey}
          onChange={e => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
          placeholder="VARIABLE_NAME"
          className="w-full px-3 py-2 text-xs font-mono bg-secondary border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
        />
        <input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder="secret_value..."
          type="password"
          className="w-full px-3 py-2 text-xs font-mono bg-secondary border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={addSecret}
          disabled={!newKey.trim() || !newValue.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Secret
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence>
          {secrets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No secrets configured</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Add API keys and env variables here</p>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {secrets.map(s => (
                <motion.div key={s.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 px-3 py-2.5 bg-secondary/60 border border-border rounded-lg group">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono font-semibold text-foreground truncate">VITE_{s.key}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                      {visibleKeys.has(s.key) ? s.value : '•'.repeat(Math.min(s.value.length, 20))}
                    </p>
                  </div>
                  <button onClick={() => toggleVisibility(s.key)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                    {visibleKeys.has(s.key) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => removeSecret(s.key)} className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
