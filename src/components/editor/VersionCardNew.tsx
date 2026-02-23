import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Pencil, FileOutput, Eye, Trash2, Image as ImageIcon, Package, Lightbulb, Loader2 } from 'lucide-react';
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
  isLatestVersion: boolean;
  isLive?: boolean;
}

export const VersionCardNew: React.FC<VersionCardNewProps> = ({
  version,
  isActive,
  activities,
  onSelectVersion,
  onRollback,
  isLatestVersion,
  isLive = false,
}) => {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(!isLive);

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
      {/* Header: Title + Bookmark + Rollback */}
      <div className="flex items-center gap-3 px-4 py-3 bg-secondary/60">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          <Bookmark className="w-3.5 h-3.5" />
        </div>
        <p className="text-sm font-medium text-foreground truncate flex-1">
          {version.name || `${t('chat.version')} ${version.versionNumber}`}
          {isLive && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-2 inline" />}
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
      <div className="flex border-t border-border">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex-1 text-xs font-medium py-2.5 text-center transition-colors ${
            showDetails
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => onSelectVersion?.(version)}
          className={`flex-1 text-xs font-medium py-2.5 text-center transition-colors ${
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Details panel - expandable */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3 space-y-2 bg-card/50">
              {/* Credits used */}
              {version.creditsUsed !== undefined && version.creditsUsed > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Used {version.creditsUsed} credits
                  </span>
                </div>
              )}

              {/* Actions timeline */}
              {activities.length > 0 ? (
                activities.map((file, i) => {
                  const ActionIcon = file.action === 'edited' ? Pencil :
                    file.action === 'created' ? FileOutput :
                      file.action === 'read' ? Eye :
                        file.action === 'deleted' ? Trash2 :
                          file.action === 'analyzed_image' ? ImageIcon : FileOutput;
                  const actionLabel = t(`action.${file.action}`);

                  return (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <ActionIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isLive && file.status === 'editing' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs min-w-[55px] ${isLive && file.status === 'editing' ? 'text-primary' : 'text-muted-foreground'}`}>{actionLabel}</span>
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isLive && file.status === 'editing' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/70'}`}>
                        {file.name}
                      </span>
                      {isLive && file.status === 'editing' && <Loader2 className="w-3 h-3 text-primary animate-spin ml-auto" />}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground py-1">No details available</p>
              )}

              {/* Version info footer */}
              <div className="flex items-center gap-3 py-1 mt-1 pt-2 border-t border-border/50">
                <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {t('chat.version')} {version.versionNumber} • {activities.filter(a => a.action !== 'read').length} changes
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
