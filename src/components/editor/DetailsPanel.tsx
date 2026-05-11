import React from 'react';
import { motion } from 'framer-motion';
import { Package, FileCode, ChevronDown } from 'lucide-react';
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
  isGenerating?: boolean;
}

const ReadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
    <path d="M8 2.25A3.75 3.75 0 0 0 4.25 6v12A3.75 3.75 0 0 0 8 21.75h8A3.75 3.75 0 0 0 19.75 18V8.53a.75.75 0 0 0-.22-.53l-6-6a.75.75 0 0 0-.53-.22zm5.75 1.5v2.5A2.25 2.25 0 0 0 16 8.25h1.19l-3.44-3.44zM5.75 6A2.25 2.25 0 0 1 8 3.75h4.25V6A3.75 3.75 0 0 0 16 9.75h2.25V18A2.25 2.25 0 0 1 16 20.25H8A2.25 2.25 0 0 1 5.75 18z" />
  </svg>
);

const EditedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
    <path d="M17.47 14.47a2.871 2.871 0 0 1 4.06 4.06l-4 4a.75.75 0 0 1-.53.22h-3a.75.75 0 0 1-.75-.75v-3c0-.199.08-.39.22-.53zM4.25 18V6A3.75 3.75 0 0 1 8 2.25h5c.199 0 .39.08.53.22l6 6c.14.14.22.331.22.53v2a.75.75 0 0 1-1.5 0V9.75H16A3.75 3.75 0 0 1 12.25 6V3.75H8A2.25 2.25 0 0 0 5.75 6v12A2.25 2.25 0 0 0 8 20.25h2a.75.75 0 0 1 0 1.5H8A3.75 3.75 0 0 1 4.25 18m16.22-2.47a1.37 1.37 0 0 0-1.94 0l-3.78 3.78v1.94h1.94l3.78-3.78a1.37 1.37 0 0 0 0-1.94M13.75 6A2.25 2.25 0 0 0 16 8.25h1.19l-3.44-3.44z" />
  </svg>
);

const CreatedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
    <path d="M8 2.25A3.75 3.75 0 0 0 4.25 6v12A3.75 3.75 0 0 0 8 21.75h8A3.75 3.75 0 0 0 19.75 18v-7a.75.75 0 0 0-1.5 0v7A2.25 2.25 0 0 1 16 20.25H8A2.25 2.25 0 0 1 5.75 18V6A2.25 2.25 0 0 1 8 3.75h4.25V6A3.75 3.75 0 0 0 16 9.75h2.25v.5a.75.75 0 0 0 1.5 0V8.53a.75.75 0 0 0-.22-.53l-6-6a.75.75 0 0 0-.53-.22zm5.75 1.5v2.5A2.25 2.25 0 0 0 16 8.25h1.19l-3.44-3.44z" />
  </svg>
);

const DeletedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
    <path d="M10 2.25a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5zM5.25 5a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-.25l-.8 11.2A3.75 3.75 0 0 1 13.16 20.5h-2.32a3.75 3.75 0 0 1-3.74-3.55L6.3 5.75H6A.75.75 0 0 1 5.25 5m2.56.75.79 11.1a2.25 2.25 0 0 0 2.24 2.13h2.32a2.25 2.25 0 0 0 2.24-2.13l.79-11.1z" />
  </svg>
);

const AnalyzedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
    <path d="M4.25 6A3.75 3.75 0 0 1 8 2.25h8A3.75 3.75 0 0 1 19.75 6v12A3.75 3.75 0 0 1 16 21.75H8A3.75 3.75 0 0 1 4.25 18zM8 3.75A2.25 2.25 0 0 0 5.75 6v12A2.25 2.25 0 0 0 8 20.25h8A2.25 2.25 0 0 0 18.25 18V6A2.25 2.25 0 0 0 16 3.75zm1 5a1 1 0 1 1 2 0 1 1 0 0 1-2 0m-1.47 5.22a.75.75 0 0 1 1.06 0L10 15.38l2.22-2.22a.75.75 0 0 1 .56-.16h.01a.75.75 0 0 1 .52.23l2.44 2.69a.75.75 0 1 1-1.11 1.01L12.5 14.64l-2.22 2.23a.75.75 0 0 1-1.06 0l-1.94-1.94a.75.75 0 0 1 0-1.06z" />
  </svg>
);

const getActionConfig = (action: string) => {
  switch (action) {
    case 'edited': return { label: 'Edited', color: 'text-muted-foreground', Icon: EditedIcon };
    case 'created': return { label: 'Created', color: 'text-muted-foreground', Icon: CreatedIcon };
    case 'read': return { label: 'Read', color: 'text-muted-foreground/80', Icon: ReadIcon };
    case 'deleted': return { label: 'Deleted', color: 'text-red-400', Icon: DeletedIcon };
    case 'analyzed_image': return { label: 'Analyzed', color: 'text-purple-400', Icon: AnalyzedIcon };
    default: return { label: action, color: 'text-muted-foreground', Icon: ReadIcon };
  }
};

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ version, activities, onClose, isGenerating }) => {
  const { t } = useLanguage();

  const changeCount = activities.filter(a => a.action !== 'read').length;
  const modifiedFiles = activities.filter(a => a.action === 'edited');
  const createdFiles = activities.filter(a => a.action === 'created');
  const readFiles = activities.filter(a => a.action === 'read');
  const otherFiles = activities.filter(a => !['edited', 'created', 'read'].includes(a.action));
  const groupedActivities = [...modifiedFiles, ...createdFiles, ...otherFiles, ...readFiles];

  return (
    <div className="h-full flex flex-col bg-editor-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-border bg-editor-bg">
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

      {/* File Activities List */}
      <div className="flex-1 overflow-y-auto pt-2 pb-4 no-scrollbar">
        {groupedActivities.length > 0 ? (
          <div className="divide-y divide-border/40">
            {groupedActivities.map((file, i) => {
              const config = getActionConfig(file.action);
              const showChevron = file.action === 'edited' || file.action === 'created';

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02, duration: 0.15 }}
                  className="flex items-center gap-3 px-5 py-5 transition-colors cursor-default group hover:bg-secondary/40"
                >
                  <div className={`${config.color}`}>
                    <config.Icon />
                  </div>
                  <span className={`text-[13px] font-medium min-w-[56px] ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-secondary/80 text-foreground/70 truncate">
                    {file.name}
                  </span>
                  {showChevron && (
                    <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors flex-shrink-0" />
                  )}
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
          <div className="flex items-center gap-3 mt-2 pt-3 px-5 border-t border-border">
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-mono text-muted-foreground">
              v{version.versionNumber} • {changeCount} changes • {activities.length} total
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
