import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Check, RotateCcw, Loader2 } from 'lucide-react';
import type { ProjectVersion } from '@/hooks/useVersions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VersionCardProps {
  version: ProjectVersion;
  isActive: boolean;
  onClick: () => void;
  onRollback?: (versionNumber: number) => Promise<void>;
  isLatest?: boolean;
}

export const VersionCard: React.FC<VersionCardProps> = ({
  version,
  isActive,
  onClick,
  onRollback,
  isLatest = false,
}) => {
  const [isRollingBack, setIsRollingBack] = useState(false);

  const handleRollback = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRollback) return;
    
    setIsRollingBack(true);
    try {
      await onRollback(version.versionNumber);
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
          isActive 
            ? 'bg-secondary border border-primary/50 shadow-lg shadow-primary/10' 
            : 'bg-secondary border border-border hover:border-primary/30'
        }`}
      >
        {/* Bookmark Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isActive 
            ? 'bg-primary/20 text-primary' 
            : 'bg-muted text-muted-foreground'
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
            isActive ? 'text-foreground' : 'text-foreground/80'
          }`}>
            {version.name || `Version ${version.versionNumber}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Version {version.versionNumber}
          </p>
        </div>

        {/* Actions count if available */}
        {version.actionsTaken && version.actionsTaken.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {version.actionsTaken.length} files
          </span>
        )}
      </button>

      {/* Rollback Button - Show on hover, hide for latest version */}
      {!isLatest && onRollback && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
              title="Rollback to this version"
              disabled={isRollingBack}
            >
              {isRollingBack ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore your project to <strong>Version {version.versionNumber}</strong> ({version.name || 'Unnamed'}).
                <br /><br />
                <span className="text-destructive font-medium">
                  Warning: All versions after this point will be permanently deleted. This action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRollback}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isRollingBack ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rolling back...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Rollback
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </motion.div>
  );
};
