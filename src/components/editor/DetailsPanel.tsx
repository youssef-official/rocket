import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, FileOutput, Eye, Trash2, Image as ImageIcon, Package, X, GitCommit, FileCode, ChevronRight } from 'lucide-react';
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

const getActionStyles = (action: string) => {
  switch (action) {
    case 'edited': return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'MODIFIED', dotColor: 'bg-yellow-400' };
    case 'created': return { color: 'text-green-400', bg: 'bg-green-400/10', label: 'CREATED', dotColor: 'bg-green-400' };
    case 'read': return { color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'READ', dotColor: 'bg-muted-foreground' };
    case 'deleted': return { color: 'text-red-400', bg: 'bg-red-400/10', label: 'DELETED', dotColor: 'bg-red-400' };
    case 'analyzed_image': return { color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'ANALYZED', dotColor: 'bg-purple-400' };
    default: return { color: 'text-muted-foreground', bg: 'bg-muted/50', label: action, dotColor: 'bg-muted-foreground' };
  }
};

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

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ version, activities, onClose }) => {
  const { t } = useLanguage();

  const changeCount = activities.filter(a => a.action !== 'read').length;
  const modifiedFiles = activities.filter(a => a.action === 'edited');
  const createdFiles = activities.filter(a => a.action === 'created');
  const readFiles = activities.filter(a => a.action === 'read');
  const otherFiles = activities.filter(a => !['edited', 'created', 'read'].includes(a.action));

  const groupedActivities = [...modifiedFiles, ...createdFiles, ...otherFiles, ...readFiles];

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-border bg-card">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground border border-border"
        >
          Close
        </button>
        <span className="text-sm font-semibold text-foreground">Details</span>
        <span className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-primary/10 text-primary border border-primary/20">
          Changes
        </span>
      </div>

      {/* Version Summary Card */}
      <div className="mx-4 mt-4 mb-3 rounded-xl overflow-hidden border border-border bg-secondary">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
            <GitCommit className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {version.name || `Version ${version.versionNumber}`}
            </p>
            <p className="text-[11px] mt-0.5 text-muted-foreground">
              Version {version.versionNumber} • {changeCount} {changeCount === 1 ? 'change' : 'changes'}
            </p>
          </div>
          {version.creditsUsed !== undefined && version.creditsUsed > 0 && (
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-yellow-400/10 text-yellow-500 border border-yellow-400/20">
              {version.creditsUsed} cr
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          {modifiedFiles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-[11px] font-medium text-muted-foreground">{modifiedFiles.length} modified</span>
            </div>
          )}
          {createdFiles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[11px] font-medium text-muted-foreground">{createdFiles.length} created</span>
            </div>
          )}
          {readFiles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
              <span className="text-[11px] font-medium text-muted-foreground">{readFiles.length} read</span>
            </div>
          )}
        </div>
      </div>

      {/* File Activities List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
        {groupedActivities.length > 0 ? (
          <div className="space-y-0.5">
            {groupedActivities.map((file, i) => {
              const ActionIcon = getActionIcon(file.action);
              const styles = getActionStyles(file.action);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-default group hover:bg-secondary/80"
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${styles.bg}`}>
                    <ActionIcon className={`w-3.5 h-3.5 ${styles.color}`} />
                  </div>

                  <span className={`text-[11px] font-semibold uppercase tracking-wide min-w-[68px] ${styles.color}`}>
                    {styles.label}
                  </span>

                  <span className="text-[12px] font-mono px-2 py-0.5 rounded-md truncate bg-secondary text-foreground/80 border border-border">
                    {file.name}
                  </span>

                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0 text-muted-foreground" />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-secondary border border-border">
              <FileCode className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No details available</p>
          </div>
        )}

        {/* Footer Summary */}
        {activities.length > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-3 px-3 border-t border-border">
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-mono text-muted-foreground">
              v{version.versionNumber} • {changeCount} changes • {activities.length} total operations
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
