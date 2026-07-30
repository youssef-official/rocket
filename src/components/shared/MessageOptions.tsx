import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Link, Eye, Clock, Coins, Copy, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MessageOptionsProps {
  messageId: string;
  creditsUsed?: number;
  workTime?: number;
  onPreview?: () => void;
}

export const MessageOptions: React.FC<MessageOptionsProps> = ({
  messageId,
  creditsUsed,
  workTime,
  onPreview
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t, isRTL } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyMessageLink = async () => {
    const link = `${window.location.origin}/message/${messageId}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 w-56 bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50`}
          >
            {/* Copy Link */}
            <button
              onClick={copyMessageLink}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm text-foreground">{t('message.copyLink')}</span>
              </div>
              {copied && <span className="text-xs text-green-500">{t('common.copied')}</span>}
            </button>

            {/* Preview */}
            {onPreview && (
              <button
                onClick={() => {
                  onPreview();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{t('message.preview')}</span>
              </button>
            )}

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Work Time */}
            {workTime !== undefined && (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('message.workedFor')}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{formatTime(workTime)}</span>
              </div>
            )}

            {/* Credits Used */}
            {creditsUsed !== undefined && (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Coins className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-muted-foreground">{t('message.creditsUsed')}</span>
                </div>
                <span className="text-sm font-medium text-pink-400">{creditsUsed.toFixed(2)}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
