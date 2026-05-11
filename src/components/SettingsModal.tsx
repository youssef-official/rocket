import { useState, useEffect, useRef } from 'react';
import { AI_PROVIDER_PRESETS, getAIConfig, setAIConfig, type AIConfig } from '@/lib/aiProviders';
import { testConnection } from '@/services/localAiService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, ExternalLink, CheckCircle2, XCircle, Loader2, Plus, X } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: Props) {
  const [providerId, setProviderId] = useState('openai');
  const [providerName, setProviderName] = useState('OpenAI');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [newCustomModel, setNewCustomModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!open) return;
    const cfg = getAIConfig();
    if (cfg) {
      setProviderId(cfg.providerId);
      setProviderName(cfg.providerName);
      setBaseUrl(cfg.baseUrl);
      setApiKey(cfg.apiKey);
      setModel(cfg.model);
      setCustomModels(cfg.customModels || []);
    }
    loaded.current = true;
  }, [open]);

  const preset = AI_PROVIDER_PRESETS.find(p => p.id === providerId);

  const handleProviderChange = (id: string) => {
    const p = AI_PROVIDER_PRESETS.find(x => x.id === id);
    if (!p) return;
    setProviderId(id);
    setProviderName(p.name);
    setBaseUrl(p.baseUrl);
    setModel(p.models[0] || '');
    setTestResult(null);
  };

  const allModels = Array.from(new Set([...(preset?.models || []), ...customModels].filter(Boolean)));

  const addCustomModel = () => {
    const m = newCustomModel.trim();
    if (!m) return;
    if (customModels.includes(m)) return;
    setCustomModels([...customModels, m]);
    setNewCustomModel('');
    setModel(m);
  };

  const removeCustomModel = (m: string) => {
    setCustomModels(customModels.filter(x => x !== m));
    if (model === m) setModel(allModels.filter(x => x !== m)[0] || '');
  };

  const handleSave = () => {
    if (!baseUrl.trim()) return toast.error('Base URL is required');
    if (!model.trim()) return toast.error('Model is required');
    const cfg: AIConfig = {
      providerId,
      providerName: providerId === 'custom' ? (providerName || 'Custom') : (preset?.name || providerName),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
      customModels,
    };
    setAIConfig(cfg);
    toast.success('Settings saved');
    onOpenChange(false);
  };

  const handleTest = async () => {
    if (!baseUrl.trim() || !apiKey.trim() || !model.trim()) {
      return toast.error('Fill base URL, API key and model first');
    }
    // temporarily save to test
    const prev = getAIConfig();
    setAIConfig({ providerId, providerName, baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), model: model.trim(), customModels });
    setTesting(true);
    setTestResult(null);
    const r = await testConnection(model.trim());
    setTestResult(r);
    setTesting(false);
    if (!r.ok && prev) setAIConfig(prev);
    if (r.ok) toast.success('Connection works');
    else toast.error('Connection failed');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Provider Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>Provider</Label>
            <Select value={providerId} onValueChange={handleProviderChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AI_PROVIDER_PRESETS.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {preset?.docsUrl && (
              <a href={preset.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1 hover:text-primary">
                Get API key <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {providerId === 'custom' && (
            <div>
              <Label>Provider Name</Label>
              <Input value={providerName} onChange={e => setProviderName(e.target.value)} placeholder="My Provider" />
            </div>
          )}

          <div>
            <Label>Base URL</Label>
            <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
            <p className="text-xs text-muted-foreground mt-1">OpenAI-compatible /chat/completions endpoint</p>
          </div>

          <div>
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={preset?.apiKeyHint || 'Your API key'}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowKey(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stored locally on your device only</p>
          </div>

          <div>
            <Label>Model</Label>
            {allModels.length > 0 ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  {allModels.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={model} onChange={e => setModel(e.target.value)} placeholder="model-id" />
            )}
            {customModels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {customModels.map(m => (
                  <span key={m} className="text-xs bg-muted px-2 py-1 rounded inline-flex items-center gap-1">
                    {m}
                    <button onClick={() => removeCustomModel(m)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Input
                value={newCustomModel}
                onChange={e => setNewCustomModel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomModel())}
                placeholder="Add custom model id"
                className="text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomModel}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {testResult && (
            <div className={`text-sm flex items-start gap-2 p-2 rounded ${testResult.ok ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
              {testResult.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
              <span className="break-all">{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleTest} variant="outline" disabled={testing}>
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
            </Button>
            <Button onClick={handleSave} className="flex-1">Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
