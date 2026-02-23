import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, FileOutput, Eye, Trash2, Image as ImageIcon, Lightbulb, Package, X, Bookmark } from 'lucide-react';
import type { ProjectVersion } from '@/hooks/useVersions';
import { useLanguage } from '@/contexts/LanguageContext';

interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'read' | 'edited' | 'created' | 'analyzed_image' | 'deleted';
}

interface DetailsPanelProps {
  version: ProjectVersion;
  activities: FileActivity[];
  onClose: () => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ version, activities, onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/60">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
            <Bookmark className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {version.name || `${t('chat.version')} ${version.versionNumber}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('chat.version')} {version.versionNumber} • {activities.filter(a => a.action !== 'read').length} changes
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {/* Credits */}
        {version.creditsUsed !== undefined && version.creditsUsed > 0 && (
          <div className="flex items-center gap-3 py-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Used {version.creditsUsed} credits
            </span>
          </div>
        )}

        {activities.length > 0 ? (
          activities.map((file, i) => {
            const ActionIcon = file.action === 'edited' ? Pencil :
              file.action === 'created' ? FileOutput :
                file.action === 'read' ? Eye :
                  file.action === 'deleted' ? Trash2 :
                    file.action === 'analyzed_image' ? ImageIcon : FileOutput;
            const actionLabel = t(`action.${file.action}`);

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
              >
                <ActionIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground min-w-[60px]">{actionLabel}</span>
                <span className="text-sm font-mono px-2 py-0.5 rounded bg-secondary text-foreground/70">
                  {file.name}
                </span>
              </motion.div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No details available</p>
        )}

        {/* Footer */}
        {activities.length > 0 && (
          <div className="flex items-center gap-3 py-3 mt-2 pt-3 border-t border-border">
            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              {t('chat.version')} {version.versionNumber} • {activities.filter(a => a.action !== 'read').length} changes
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
