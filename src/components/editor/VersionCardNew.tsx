import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Loader2, Pencil, FileOutput, Eye, Trash2, Image as ImageIcon, ChevronRight, CheckCircle2 } from 'lucide-react';
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

const getActionIcon = (action: string) => {
  switch (action) {
    case 'edited': return Pencil;
    case 'created': return FileOutput;
    case 'read': return Eye;
    case 'deleted': return Trash2;
    case 'analyzed_image': return ImageIcon;
    default: return FileOutput;
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

  // Find the current (last editing) file activity during live generation
  const currentActivity = isLive
    ? [...activities].reverse().find(a => a.status === 'editing') || activities[activities.length - 1]
    : null;

  const CurrentIcon = currentActivity ? getActionIcon(currentActivity.action) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden transition-all ${
        isActive
          ? 'border-primary/40 shadow-lg shadow-primary/10'
          : 'border-border'
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
            <div className="px-4 py-3 bg-secondary/60">
              {currentActivity && CurrentIcon ? (
                <div className="flex items-center gap-3">
                  <motion.div
                    key={currentActivity.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <CurrentIcon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-primary">
                      {t(`action.${currentActivity.action}`)}
                    </span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate">
                      {currentActivity.name}
                    </span>
                  </motion.div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Generating...</span>
                </div>
              )}
              {liveStatus && (
                <p className="text-xs text-muted-foreground mt-1.5 truncate">{liveStatus}</p>
              )}
            </div>
            {/* Details button during live */}
            <div className="px-3 py-2.5 border-t border-border">
              <button
                onClick={() => onShowDetails?.(version, activities)}
                className="w-full text-xs font-medium py-2 text-center rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent border border-border/60"
              >
                Details
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
            {/* Header: Title + Bookmark + Rollback */}
            <div className="flex items-center gap-3 px-4 py-3 bg-secondary/60">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
              </motion.div>
              <p className="text-sm font-medium text-foreground truncate flex-1">
                {version.name || `${t('chat.version')} ${version.versionNumber}`}
              </p>
              {/* Rollback arrow */}
              {!isLatestVersion && onRollback && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRollback(version.versionNumber);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title={t('chat.rollback')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              )}
            </div>

            {/* Tab buttons: Details / Preview */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex gap-2 px-3 py-2.5 border-t border-border"
            >
              <button
                onClick={() => onShowDetails?.(version, activities)}
                className="flex-1 text-xs font-medium py-2 text-center rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent border border-border/60"
              >
                Details
              </button>
              <button
                onClick={() => onSelectVersion?.(version)}
                className={`flex-1 text-xs font-medium py-2 text-center rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-border/60'
                }`}
              >
                Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
