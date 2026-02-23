import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Loader2, Pencil, FileOutput, Eye, Trash2, Image as ImageIcon, CheckCircle2, Sparkles, RotateCcw, Code2, FileCode, FileType, File, Zap } from 'lucide-react';
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

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx': case 'ts': return <Code2 className="w-3 h-3 text-blue-400" />;
    case 'jsx': case 'js': return <FileCode className="w-3 h-3 text-yellow-400" />;
    case 'css': return <FileType className="w-3 h-3 text-purple-400" />;
    case 'html': return <File className="w-3 h-3 text-orange-400" />;
    default: return <File className="w-3 h-3 text-muted-foreground" />;
  }
};

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
}) => {
  const { t } = useLanguage();

  const doneCount = activities.filter(a => a.status === 'done').length;
  const totalCount = activities.length;
  const editCount = activities.filter(a => a.action === 'edited').length;
  const createCount = activities.filter(a => a.action === 'created').length;
  const totalChanges = editCount + createCount;

  // Get last 3 active files for the live ticker
  const recentFiles = isLive
    ? [...activities].reverse().slice(0, 3)
    : [];

  const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden transition-all ${
        isLive
          ? 'border-primary/30 shadow-lg shadow-primary/5 bg-card'
          : isActive
            ? 'border-primary/30 shadow-lg shadow-primary/5'
            : 'border-border hover:border-border/80'
      }`}
    >
      <AnimatePresence mode="wait">
        {isLive ? (
          /* ── Live generation state ── */
          <motion.div
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Live Header */}
            <div className="px-4 pt-3.5 pb-2">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center"
                  >
                    <Zap className="w-3.5 h-3.5 text-primary" />
                  </motion.div>
                  <span className="text-xs font-bold text-foreground">Generating</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-primary tabular-nums">
                    {doneCount}/{totalCount}
                  </span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Live File Ticker */}
            <div className="px-3 py-2 space-y-0.5">
              {recentFiles.map((file, i) => {
                const meta = getActionMeta(file.action);
                const isEditing = file.status === 'editing';
                const fileName = file.name.split('/').pop() || file.name;

                return (
                  <motion.div
                    key={file.name + i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                      isEditing ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      {isEditing ? (
                        <Loader2 className={`w-3 h-3 ${meta.color} animate-spin`} />
                      ) : (
                        getFileIcon(file.name)
                      )}
                    </div>
                    <span className={`text-[11px] font-mono truncate flex-1 ${
                      isEditing ? 'text-primary font-medium' : 'text-foreground/60'
                    }`}>
                      {fileName}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider ${meta.color}`}>
                      {t(`action.${file.action}`)}
                    </span>
                    {isEditing && (
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Status text */}
            {liveStatus && (
              <div className="px-4 pb-2">
                <p className="text-[11px] text-muted-foreground/60 truncate">{liveStatus}</p>
              </div>
            )}

            {/* Details button during live */}
            <div className="px-3 py-2 border-t border-border/40">
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
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5">
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
                  <div className="flex items-center gap-2 mt-0.5">
                    {createCount > 0 && (
                      <span className="text-[10px] text-emerald-400 font-medium">+{createCount} new</span>
                    )}
                    {editCount > 0 && (
                      <span className="text-[10px] text-blue-400 font-medium">~{editCount} mod</span>
                    )}
                  </div>
                )}
              </div>
              {/* Rollback */}
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

            {/* Action buttons */}
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
