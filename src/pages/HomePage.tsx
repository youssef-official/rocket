import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector } from '@/components/ModelSelector';
import { UserMenuDropdown } from '@/components/UserMenuDropdown';
import { SettingsModal } from '@/components/SettingsModal';
import { saveProject, getProjects, deleteProject, newId, type LocalProject } from '@/lib/storage';
import { getAIConfig, getAvailableModels } from '@/lib/aiProviders';
import { ArrowUp, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function HomePage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projects, setProjects] = useState<LocalProject[]>([]);

  useEffect(() => {
    setProjects(getProjects());
    const cfg = getAIConfig();
    if (cfg) setModel(cfg.model);
  }, [settingsOpen]);

  const handleStart = () => {
    if (!prompt.trim()) return;
    const cfg = getAIConfig();
    if (!cfg || !cfg.apiKey) {
      toast.error('Configure AI provider first');
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
    if (model) sessionStorage.setItem(`pending_model_${id}`, model);
    navigate(`/project/${id}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    deleteProject(id);
    setProjects(getProjects());
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="font-bold text-xl">Vivora <span className="text-primary">Local</span></h1>
        </div>
        <UserMenuDropdown onOpenSettings={() => setSettingsOpen(true)} />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">What will you build today?</h2>
          <p className="text-muted-foreground">Local-first AI assistant. Bring your own API key.</p>
        </div>

        <div className="border rounded-2xl bg-card shadow-sm p-3">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleStart();
              }
            }}
            placeholder="Describe what you want to build or ask anything..."
            className="border-0 resize-none focus-visible:ring-0 min-h-[100px] text-base"
          />
          <div className="flex items-center justify-between mt-2">
            <ModelSelector value={model} onChange={setModel} onOpenSettings={() => setSettingsOpen(true)} />
            <Button onClick={handleStart} size="sm" disabled={!prompt.trim()}>
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Your projects</h3>
            <div className="space-y-2">
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="group flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(p.updatedAt).toLocaleString()}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => handleDelete(p.id, e)} className="opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
