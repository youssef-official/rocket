import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector } from '@/components/ModelSelector';
import { UserMenuDropdown } from '@/components/UserMenuDropdown';
import { SettingsModal } from '@/components/SettingsModal';
import { getProject, getMessages, saveMessages, saveProject, newId, type LocalMessage, type LocalProject } from '@/lib/storage';
import { streamChat, AIConfigError } from '@/services/localAiService';
import { getAIConfig } from '@/lib/aiProviders';
import { ArrowUp, ArrowLeft, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<LocalProject | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialRan = useRef(false);

  useEffect(() => {
    if (!id) return;
    const p = getProject(id);
    if (!p) {
      navigate('/');
      return;
    }
    setProject(p);
    setMessages(getMessages(id));
    const cfg = getAIConfig();
    const savedModel = sessionStorage.getItem(`pending_model_${id}`);
    if (savedModel) {
      setModel(savedModel);
      sessionStorage.removeItem(`pending_model_${id}`);
    } else if (cfg) setModel(cfg.model);

    // Auto-run pending prompt
    const pending = sessionStorage.getItem(`pending_prompt_${id}`);
    if (pending && !initialRan.current) {
      initialRan.current = true;
      sessionStorage.removeItem(`pending_prompt_${id}`);
      setTimeout(() => sendMessage(pending, savedModel || cfg?.model || ''), 50);
    }
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string, modelOverride?: string) => {
    if (!text.trim() || !id) return;
    const useModel = modelOverride || model;
    const cfg = getAIConfig();
    if (!cfg || !cfg.apiKey) {
      toast.error('Configure AI in Settings first');
      setSettingsOpen(true);
      return;
    }

    const userMsg: LocalMessage = {
      id: newId(),
      projectId: id,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const assistantMsg: LocalMessage = {
      id: newId(),
      projectId: id,
      role: 'assistant',
      content: '',
      model: useModel,
      createdAt: new Date().toISOString(),
    };
    const allMsgs = [...messages, userMsg, assistantMsg];
    setMessages(allMsgs);
    saveMessages(id, allMsgs);
    setInput('');
    setIsStreaming(true);

    abortRef.current = new AbortController();
    const turns = allMsgs
      .filter(m => !(m.role === 'assistant' && !m.content))
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      let acc = '';
      for await (const chunk of streamChat(turns, { model: useModel, signal: abortRef.current.signal })) {
        acc += chunk;
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: acc };
          return next;
        });
      }
      // persist final
      setMessages(prev => {
        saveMessages(id, prev);
        return prev;
      });
      // bump project updated
      const p = getProject(id);
      if (p) saveProject({ ...p, updatedAt: new Date().toISOString() });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast.info('Stopped');
      } else {
        toast.error(e.message || 'Failed');
        if (e instanceof AIConfigError) setSettingsOpen(true);
      }
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          next.pop();
        }
        saveMessages(id, next);
        return next;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();

  if (!project) return null;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-medium truncate">{project.name}</h1>
        </div>
        <UserMenuDropdown onOpenSettings={() => setSettingsOpen(true)} />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-20">
              Start the conversation below.
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
              <div className={`${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl px-4 py-2 max-w-[85%]' : 'prose prose-sm dark:prose-invert max-w-full'}`}>
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <>
                    <ReactMarkdown>{m.content || '...'}</ReactMarkdown>
                    {m.model && <div className="text-xs text-muted-foreground mt-1">{m.model}</div>}
                  </>
                )}
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="border-t p-3">
        <div className="max-w-3xl mx-auto border rounded-2xl bg-card p-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Send a message..."
            className="border-0 resize-none focus-visible:ring-0 min-h-[60px]"
            disabled={isStreaming}
          />
          <div className="flex items-center justify-between mt-1">
            <ModelSelector value={model} onChange={setModel} onOpenSettings={() => setSettingsOpen(true)} />
            {isStreaming ? (
              <Button onClick={handleStop} size="sm" variant="destructive">
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => sendMessage(input)} size="sm" disabled={!input.trim()}>
                <ArrowUp className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
