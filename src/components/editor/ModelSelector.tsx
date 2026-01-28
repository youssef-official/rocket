import React from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Zap, Lock, Sparkles, Brain, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export type ModelId = 'rok-fast' | 'rok-smart' | 'rok-turbo' | 'rok-ultra' | 'rok-reson';

interface ModelSelectorProps {
  currentModel: ModelId;
  onModelChange: (model: ModelId) => void;
  userPlan: 'spark' | 'builder' | 'creator' | 'scale';
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModel,
  onModelChange,
  userPlan
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const models: {
    id: ModelId;
    name: string;
    icon: React.ElementType;
    minPlan: string;
    desc: string;
    multiplier: string;
    locked: boolean;
  }[] = [
    {
      id: 'rok-fast',
      name: 'Rok-Fast',
      icon: Zap,
      minPlan: 'spark',
      desc: 'Xiaomi Mimo (Quick edits)',
      multiplier: '1x',
      locked: false
    },
    {
      id: 'rok-smart',
      name: 'Rok-Smart',
      icon: Brain,
      minPlan: 'spark',
      desc: 'MiniMax (Stable coding)',
      multiplier: '1.3x',
      locked: false
    },
    {
      id: 'rok-turbo',
      name: 'Rok-Turbo',
      icon: Rocket,
      minPlan: 'builder',
      desc: 'Gemini Flash (Production)',
      multiplier: '2.2x',
      locked: userPlan === 'spark'
    },
    {
      id: 'rok-ultra',
      name: 'Rok-Ultra',
      icon: Sparkles,
      minPlan: 'creator',
      desc: 'Claude Haiku (Smart logic)',
      multiplier: '3x',
      locked: userPlan === 'spark' || userPlan === 'builder'
    },
    {
      id: 'rok-reson',
      name: 'Rok-Reson',
      icon: Sparkles,
      minPlan: 'scale',
      desc: 'Claude Opus (Deep systems)',
      multiplier: '4x',
      locked: userPlan !== 'scale'
    },
  ];

  const handleValueChange = (value: string) => {
    const model = models.find(m => m.id === value);
    if (model?.locked) {
      toast({
        title: "Upgrade Required",
        description: `Upgrade to ${model.minPlan.charAt(0).toUpperCase() + model.minPlan.slice(1)} plan to use ${model.name}.`,
        action: (
          <button
            onClick={() => navigate('/pricing')}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-bold"
          >
            Upgrade
          </button>
        )
      });
      return;
    }
    onModelChange(value as ModelId);
  };

  const selectedModel = models.find(m => m.id === currentModel) || models[0];

  return (
    <Select value={currentModel} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px] h-9 text-xs bg-secondary/50 border-border">
        <div className="flex items-center gap-2">
          <selectedModel.icon className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium">{selectedModel.name}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem
            key={model.id}
            value={model.id}
            disabled={model.locked}
            className="text-xs"
          >
            <div className="flex items-center justify-between w-full min-w-[200px] py-1">
              <div className="flex items-center gap-2">
                <model.icon className={`w-3.5 h-3.5 ${model.locked ? 'text-muted-foreground' : 'text-primary'}`} />
                <div className="flex flex-col text-left">
                  <span className={model.locked ? 'text-muted-foreground' : 'text-foreground'}>
                    {model.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{model.desc}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">
                  {model.multiplier}
                </Badge>
                {model.locked && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
