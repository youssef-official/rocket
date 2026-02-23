import React from 'react';
import { motion } from 'framer-motion';
import { Package, FileCode, Pencil, Sparkles, Eye, Trash2, Image as ImageIcon, FileOutput, X, Code2, FileType, File, FileJson, Clock, ArrowLeft } from 'lucide-react';
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

const getActionConfig = (action: string) => {
  switch (action) {
    case 'edited':
      return { label: 'Modified', color: 'text-blue-400', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/20', Icon: Pencil };
    case 'created':
      return { label: 'Created', color: 'text-emerald-400', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', Icon: Sparkles };
    case 'read':
      return { label: 'Read', color: 'text-muted-foreground', bg: 'bg-secondary', borderColor: 'border-border', Icon: Eye };
    case 'deleted':
      return { label: 'Deleted', color: 'text-red-400', bg: 'bg-red-500/10', borderColor: 'border-red-500/20', Icon: Trash2 };
    case 'analyzed_image':
      return { label: 'Analyzed', color: 'text-purple-400', bg: 'bg-purple-500/10', borderColor: 'border-purple-500/20', Icon: ImageIcon };
    default:
      return { label: action, color: 'text-muted-foreground', bg: 'bg-secondary', borderColor: 'border-border', Icon: FileOutput };
  }
};

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
      return <Code2 className="w-3.5 h-3.5 text-blue-400" />;
    case 'jsx':
    case 'js':
      return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
    case 'css':
      return <FileType className="w-3.5 h-3.5 text-purple-400" />;
    case 'html':
      return <File className="w-3.5 h-3.5 text-orange-400" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-green-400" />;
    default:
      return <File className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

const getFileDir = (filepath: string) => {
  const parts = filepath.split('/');
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join('/') + '/';
};

const getFileName = (filepath: string) => {
  return filepath.split('/').pop() || filepath;
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ version, activities, onClose, isGenerating }) => {
  const { t } = useLanguage();

  const modifiedFiles = activities.filter(a => a.action === 'edited');
  const createdFiles = activities.filter(a => a.action === 'created');
  const deletedFiles = activities.filter(a => a.action === 'deleted');
  const readFiles = activities.filter(a => a.action === 'read');
  const analyzedFiles = activities.filter(a => a.action === 'analyzed_image');

  const sections = [
    { label: 'Created', files: createdFiles, action: 'created' },
    { label: 'Modified', files: modifiedFiles, action: 'edited' },
    { label: 'Analyzed', files: analyzedFiles, action: 'analyzed_image' },
    { label: 'Deleted', files: deletedFiles, action: 'deleted' },
    { label: 'Read', files: readFiles, action: 'read' },
  ].filter(s => s.files.length > 0);

  const changeCount = activities.filter(a => a.action !== 'read').length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0 border-b border-border bg-card">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {version.name || `Version ${version.versionNumber}`}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{formatTime(version.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {changeCount > 0 && (
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-primary/10 text-primary tabular-nums">
              {changeCount} {changeCount === 1 ? 'change' : 'changes'}
            </span>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-card/50">
        {[
          { count: createdFiles.length, label: 'New', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { count: modifiedFiles.length, label: 'Mod', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { count: deletedFiles.length, label: 'Del', color: 'text-red-400', bg: 'bg-red-500/10' },
          { count: readFiles.length, label: 'Read', color: 'text-muted-foreground', bg: 'bg-secondary' },
        ].filter(s => s.count > 0).map((stat, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-md ${stat.bg} flex items-center justify-center text-[10px] font-bold ${stat.color} tabular-nums`}>
              {stat.count}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* File Sections */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {sections.length > 0 ? (
          <div className="py-2">
            {sections.map((section, sectionIdx) => {
              const config = getActionConfig(section.action);

              return (
                <div key={section.action} className={sectionIdx > 0 ? 'mt-1' : ''}>
                  {/* Section Header */}
                  <div className="flex items-center gap-2.5 px-4 py-2">
                    <div className={`w-5 h-5 rounded-md ${config.bg} flex items-center justify-center`}>
                      <config.Icon className={`w-3 h-3 ${config.color}`} />
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                      ({section.files.length})
                    </span>
                    <div className="flex-1 h-px bg-border/30" />
                  </div>

                  {/* Files */}
                  <div className="px-2">
                    {section.files.map((file, i) => {
                      const dir = getFileDir(file.name);
                      const name = getFileName(file.name);

                      return (
                        <motion.div
                          key={file.name}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02, duration: 0.15 }}
                          className={`flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg transition-colors cursor-default hover:bg-secondary/60 group ${
                            file.status === 'editing' ? 'bg-primary/5' : ''
                          }`}
                        >
                          {/* File type icon */}
                          <div className="w-6 h-6 rounded-md bg-secondary/80 flex items-center justify-center flex-shrink-0">
                            {getFileIcon(file.name)}
                          </div>

                          {/* File path */}
                          <div className="flex-1 min-w-0 flex items-baseline gap-0">
                            {dir && (
                              <span className="text-[11px] text-muted-foreground/50 font-mono truncate">
                                {dir}
                              </span>
                            )}
                            <span className={`text-[12px] font-mono font-medium truncate ${
                              file.status === 'editing' ? 'text-primary' : 'text-foreground/80'
                            }`}>
                              {name}
                            </span>
                          </div>

                          {/* Extension badge */}
                          <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {name.split('.').pop()}
                          </span>

                          {/* Live editing indicator */}
                          {file.status === 'editing' && (
                            <motion.div
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-secondary border border-border">
              <FileCode className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No file activity</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Changes will appear here during generation</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-card">
          <Package className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-mono text-muted-foreground">
            v{version.versionNumber} · {changeCount} changes · {activities.length} files total
          </span>
        </div>
      )}
    </div>
  );
};
