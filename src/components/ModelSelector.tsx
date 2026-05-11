import { useState, useEffect } from 'react';
import { getAvailableModels, getAIConfig } from '@/lib/aiProviders';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Cpu, ChevronDown } from 'lucide-react';

interface Props {
  value: string;
  onChange: (model: string) => void;
  onOpenSettings: () => void;
}

export function ModelSelector({ value, onChange, onOpenSettings }: Props) {
  const [models, setModels] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setModels(getAvailableModels());
  }, [tick]);

  // Refresh when window gets focus (settings might have changed)
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, []);

  const cfg = getAIConfig();
  const display = value || cfg?.model || 'No model';

  return (
    <DropdownMenu onOpenChange={(o) => o && setTick(t => t + 1)}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 max-w-[200px]">
          <Cpu className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate text-xs">{display}</span>
          <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
        {models.length === 0 && (
          <DropdownMenuItem disabled>No models — configure in Settings</DropdownMenuItem>
        )}
        {models.map(m => (
          <DropdownMenuItem key={m} onClick={() => onChange(m)} className={value === m ? 'bg-accent' : ''}>
            <span className="truncate">{m}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={onOpenSettings} className="border-t mt-1 pt-2 text-primary">
          ⚙ Open Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
