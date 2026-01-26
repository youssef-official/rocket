import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Check } from 'lucide-react';
import type { ProjectVersion } from '@/hooks/useVersions';

interface VersionCardProps {
  version: ProjectVersion;
  isActive: boolean;
  onClick: () => void;
}

export const VersionCard: React.FC<VersionCardProps> = ({
  version,
  isActive,
  onClick,
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
        isActive 
          ? 'bg-[#2a2a2a] border border-primary/50 shadow-lg shadow-primary/10' 
          : 'bg-[#2a2a2a] border border-white/10 hover:border-white/20'
      }`}
    >
      {/* Bookmark Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isActive 
          ? 'bg-primary/20 text-primary' 
          : 'bg-white/10 text-white/60'
      }`}>
        {isActive ? (
          <Check className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isActive ? 'text-white' : 'text-white/80'
        }`}>
          {version.name || `Version ${version.versionNumber}`}
        </p>
        <p className="text-xs text-white/40 mt-0.5">
          Version {version.versionNumber}
        </p>
      </div>
    </motion.button>
  );
};
