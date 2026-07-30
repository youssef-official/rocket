import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Clock, ChevronDown, Check, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ProjectVersion } from '@/hooks/useVersions';
import { useLanguage } from '@/contexts/LanguageContext';

interface VersionSelectorProps {
  versions: ProjectVersion[];
  currentVersion: number | null;
  onSelectVersion: (version: ProjectVersion) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  versions,
  currentVersion,
  onSelectVersion,
  isOpen,
  onToggle,
}) => {
  const { t } = useLanguage();
  if (versions.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4" />
        <span>{t('versions.empty')}</span>
      </div>
    );
  }

  // Ensure versions are sorted by number descending for the UI
    const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

    const currentVersionData = currentVersion 
    ? versions.find(v => v.versionNumber === currentVersion) 
    : sortedVersions[0];

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
      >
        <GitBranch className="w-4 h-4 text-primary" />
        <span className="max-w-[150px] truncate">
          {currentVersionData?.name || `Version ${currentVersionData?.versionNumber}`}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="p-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground px-2">
                Version History ({versions.length})
              </p>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
              {sortedVersions.map((version, index) => {
                const isSelected = currentVersion === version.versionNumber || 
                  (!currentVersion && index === 0);
                
                return (
                  <button
                    key={version.id}
                    onClick={() => {
                      onSelectVersion(version);
                      onToggle();
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                      isSelected 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}>
                      {isSelected ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">v{version.versionNumber}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {version.name || `Version ${version.versionNumber}`}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Object.keys(version.files).length} files • {version.chatMessages.length} messages
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
