import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Loader2, Pencil, FileOutput, Eye, Trash2, Image as ImageIcon, CheckCircle2, Sparkles, RotateCcw, Search, Code, Shield, Settings } from 'lucide-react';
import type { ProjectVersion } from '@/hooks/useVersions';
import { useLanguage } from '@/contexts/LanguageContext';

interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'read' | 'edited' | 'created' | 'analyzed_image' | 'deleted';
}

interface VersionCardNewProps {
  version: ProjectVersion;
  isActive: boolean;
  activities: FileActivity[];
  onSelectVersion?: (version: ProjectVersion) => void;
  onRollback?: (versionNumber: number) => void;
  onShowDetails?: (version: ProjectVersion, activities: FileActivity[]) => void;
  isLatestVersion: boolean;
  isLive?: boolean;
  liveStatus?: string;
  agentStep?: 'planning' | 'generating' | 'validating' | 'fixing' | 'streaming' | 'done' | 'error';
  agentConfidence?: number;
  agentIssuesCount?: number;
}

const getActionMeta = (action: string) => {
  switch (action) {
    case 'edited': return { Icon: Pencil, color: 'text-blue-400', bg: 'bg-blue-500/10' };
    case 'created': return { Icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    case 'read': return { Icon: Eye, color: 'text-muted-foreground', bg: 'bg-secondary' };
    case 'deleted': return { Icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/10' };
    case 'analyzed_image': return { Icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' };
    default: return { Icon: FileOutput, color: 'text-muted-foreground', bg: 'bg-secondary' };
  }
};

const AGENT_STAGES = [
  { key: 'planning', icon: Search, label: { en: 'Planning', ar: 'تخطيط' } },
  { key: 'generating', icon: Code, label: { en: 'Generating', ar: 'توليد' } },
  { key: 'validating', icon: Shield, label: { en: 'Validating', ar: 'مراجعة' } },
  { key: 'fixing', icon: Settings, label: { en: 'Fixing', ar: 'إصلاح' } },
  { key: 'streaming', icon: FileOutput, label: { en: 'Streaming', ar: 'إرسال' } },
] as const;

export const VersionCardNew: React.FC<VersionCardNewProps> = ({
  version,
  isActive,
  activities,
  onSelectVersion,
  onRollback,
  onShowDetails,
  isLatestVersion,
  isLive = false,
  liveStatus,
  agentStep,
  agentConfidence,
  agentIssuesCount,
}) => {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  const currentActivity = isLive
    ? [...activities].reverse().find(a => a.status === 'editing') || activities[activities.length - 1]
    : null;

  const actionMeta = currentActivity ? getActionMeta(currentActivity.action) : null;
  const CurrentIcon = actionMeta?.Icon || null;

  const editCount = activities.filter(a => a.action === 'edited').length;
  const createCount = activities.filter(a => a.action === 'created').length;
  const totalChanges = editCount + createCount;

  const stageOrder = AGENT_STAGES.map(s => s.key);
  const currentStageIdx = agentStep ? stageOrder.indexOf(agentStep as typeof stageOrder[number]) : -1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden transition-all ${
        isActive
          ? 'border-primary/30 shadow-lg shadow-primary/5'
          : 'border-border hover:border-border/80'
      }`}
    >
      <AnimatePresence mode="wait">
        {isLive ? (
          <motion.div
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Agent Stage Progress */}
            {agentStep && agentStep !== 'done' && agentStep !== 'error' && (
              <div className="px-4 pt-3 pb-1">
                <div className="flex items-center gap-1.5">
                  {AGENT_STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentStageIdx;
                    const isCurrent = idx === currentStageIdx;
                    const StageIcon = stage.icon;
                    return (
                      <motion.div
                        key={stage.key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-1"
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-primary/20 ring-1 ring-primary/40'
                              : isCompleted
                                ? 'bg-emerald-500/15'
                                : 'bg-secondary/60'
                          }`}
                          title={isAr ? stage.label.ar : stage.label.en}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : isCurrent ? (
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          ) : (
                            <StageIcon className="w-3 h-3 text-muted-foreground/40" />
                          )}
                        </div>
                        {idx < AGENT_STAGES.length - 1 && (
                          <div className={`w-3 h-0.5 rounded-full ${
                            isCompleted ? 'bg-emerald-400/40' : 'bg-border'
                          }`} />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <motion.span
                    key={agentStep}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-semibold text-primary uppercase tracking-wider"
                  >
                    {isAr
                      ? AGENT_STAGES.find(s => s.key === agentStep)?.label.ar
                      : AGENT_STAGES.find(s => s.key === agentStep)?.label.en}
                  </motion.span>
                  {agentStep === 'validating' && agentConfidence !== undefined && (
                    <span className={`text-[10px] font-bold tabular-nums ${
                      agentConfidence >= 85 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {agentConfidence}%
                    </span>
                  )}
                  {agentStep === 'fixing' && agentIssuesCount !== undefined && (
                    <span className="text-[10px] font-medium text-amber-400 tabular-nums">
                      {agentIssuesCount} {isAr ? 'مشكلة' : 'issues'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="px-4 py-3.5 bg-secondary/40">
              {currentActivity && CurrentIcon && actionMeta ? (
                <div className="flex items-center gap-3">
                  <motion.div
                    key={currentActivity.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2.5 flex-1 min-w-0"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${actionMeta.bg}`}>
                      <CurrentIcon className={`w-3.5 h-3.5 ${actionMeta.color}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
                        {t(`action.${currentActivity.action}`)}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground truncate">
                        {currentActivity.name}
                      </span>
                    </div>
                  </motion.div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {activities.filter(a => a.status === 'done').length}/{activities.length}
                    </span>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {liveStatus || (isAr ? 'جاري التوليد...' : 'Generating...')}
                  </span>
                </div>
              )}
              {liveStatus && !agentStep && (
                <p className="text-[11px] text-muted-foreground/70 mt-2 truncate pl-10">{liveStatus}</p>
              )}
            </div>
            <div className="px-3 py-2.5 border-t border-border/50">
              <button
                onClick={() => onShowDetails?.(version, activities)}
                className="w-full text-xs font-medium py-2 text-center rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-accent/80 border border-border/50 hover:border-border"
              >
                {t('chat.details') || 'Details'}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── Completed state ── */
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 bg-secondary/30">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isLatestVersion ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {version.name || `${t('chat.version')} ${version.versionNumber}`}
                </p>
                {totalChanges > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {totalChanges} {totalChanges === 1 ? 'change' : 'changes'}
                    {createCount > 0 && ` · ${createCount} new`}
                  </p>
                )}
              </div>
              {!isLatestVersion && onRollback && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRollback(version.versionNumber);
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  title={t('chat.rollback')}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex gap-2 px-3 py-2.5 border-t border-border/50"
            >
              <button
                onClick={() => onShowDetails?.(version, activities)}
                className="flex-1 text-xs font-medium py-2.5 text-center rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-accent/80 border border-border/50 hover:border-border"
              >
                {t('chat.details') || 'Details'}
              </button>
              <button
                onClick={() => onSelectVersion?.(version)}
                className={`flex-1 text-xs font-medium py-2.5 text-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/80 border border-border/50 hover:border-border'
                }`}
              >
                {t('chat.preview') || 'Preview'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};