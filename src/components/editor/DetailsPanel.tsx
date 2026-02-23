import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, FileOutput, Eye, Trash2, Image as ImageIcon, Package, X, GitCommit, FileCode, ChevronDown } from 'lucide-react';
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

const getActionColor = (action: string) => {
  switch (action) {
    case 'edited': return '#d29922';
    case 'created': return '#3fb950';
    case 'read': return '#8b949e';
    case 'deleted': return '#f85149';
    case 'analyzed_image': return '#a371f7';
    default: return '#8b949e';
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'edited': return 'Modified';
    case 'created': return 'Created';
    case 'read': return 'Read';
    case 'deleted': return 'Deleted';
    case 'analyzed_image': return 'Analyzed';
    default: return action;
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
    <div className="h-full flex flex-col" style={{ background: '#0d1117' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #21262d', background: '#010409' }}>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          style={{ color: '#c9d1d9', background: '#21262d', border: '1px solid #30363d' }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#30363d'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = '#21262d'; }}
        >
          Close
        </button>
        <span className="text-sm font-semibold" style={{ color: '#e1e4e8' }}>Details</span>
        <div className="flex items-center gap-1">
          <button className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors" style={{ color: '#58a6ff', background: 'rgba(56,139,253,0.1)', border: '1px solid rgba(56,139,253,0.2)' }}>
            Changes
          </button>
        </div>
      </div>

      {/* Version Summary Card */}
      <div className="mx-4 mt-4 mb-3 rounded-xl overflow-hidden" style={{ border: '1px solid #21262d', background: '#161b22' }}>
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #21262d' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(56,139,253,0.12)' }}>
            <GitCommit className="w-4 h-4" style={{ color: '#58a6ff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#e1e4e8' }}>
              {version.name || `Version ${version.versionNumber}`}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: '#484f58' }}>
              Version {version.versionNumber} • {changeCount} {changeCount === 1 ? 'change' : 'changes'}
            </p>
          </div>
          {version.creditsUsed !== undefined && version.creditsUsed > 0 && (
            <span className="text-[10px] font-mono px-2 py-1 rounded-md" style={{ background: 'rgba(210,153,34,0.1)', color: '#d29922', border: '1px solid rgba(210,153,34,0.2)' }}>
              {version.creditsUsed} cr
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          {modifiedFiles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#d29922' }} />
              <span className="text-[11px] font-medium" style={{ color: '#8b949e' }}>{modifiedFiles.length} modified</span>
            </div>
          )}
          {createdFiles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#3fb950' }} />
              <span className="text-[11px] font-medium" style={{ color: '#8b949e' }}>{createdFiles.length} created</span>
            </div>
          )}
          {readFiles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#484f58' }} />
              <span className="text-[11px] font-medium" style={{ color: '#8b949e' }}>{readFiles.length} read</span>
            </div>
          )}
        </div>
      </div>

      {/* File Activities List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
        {groupedActivities.length > 0 ? (
          <div className="space-y-1">
            {groupedActivities.map((file, i) => {
              const ActionIcon = file.action === 'edited' ? Pencil :
                file.action === 'created' ? FileOutput :
                  file.action === 'read' ? Eye :
                    file.action === 'deleted' ? Trash2 :
                      file.action === 'analyzed_image' ? ImageIcon : FileOutput;

              const actionColor = getActionColor(file.action);
              const actionLabel = getActionLabel(file.action);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.2 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-default group"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#161b22'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${actionColor}11` }}>
                    <ActionIcon className="w-3.5 h-3.5" style={{ color: actionColor }} />
                  </div>

                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide min-w-[62px]"
                    style={{ color: actionColor }}
                  >
                    {actionLabel}
                  </span>

                  <span
                    className="text-[12px] font-mono px-2 py-0.5 rounded-md truncate"
                    style={{
                      background: '#21262d',
                      color: '#c9d1d9',
                      border: '1px solid #30363d',
                    }}
                  >
                    {file.name}
                  </span>

                  <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" style={{ color: '#484f58' }} />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: '#161b22', border: '1px solid #21262d' }}>
              <FileCode className="w-5 h-5" style={{ color: '#484f58' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#484f58' }}>No details available</p>
          </div>
        )}

        {/* Footer Summary */}
        {activities.length > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-3 px-3" style={{ borderTop: '1px solid #21262d' }}>
            <Package className="w-3.5 h-3.5" style={{ color: '#484f58' }} />
            <span className="text-[11px] font-mono" style={{ color: '#484f58' }}>
              v{version.versionNumber} • {changeCount} changes • {activities.length} total operations
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
