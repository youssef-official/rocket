import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings as SettingsIcon,
    Check, Loader2, Eye, EyeOff, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import vercelLogo from '@/assets/logos/vercel.svg';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();
    const {
        integrations,
        loading,
        saveVercelToken,
        disconnectVercel
    } = useIntegrations();

    const [vercelToken, setVercelToken] = useState('');
    const [showVercelToken, setShowVercelToken] = useState(false);
    const [savingVercel, setSavingVercel] = useState(false);

    const handleSaveVercel = async () => {
        if (!vercelToken.trim()) return;
        setSavingVercel(true);
        const success = await saveVercelToken(vercelToken.trim());
        if (success) setVercelToken('');
        setSavingVercel(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Glassmorphism backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%)',
                            backdropFilter: 'blur(20px)'
                        }}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-6 border-b border-white/10 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <SettingsIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className={isRTL ? 'text-right' : ''}>
                                    <h2 className="text-xl font-bold text-white">{t('common.settings')}</h2>
                                    <p className="text-sm text-white/60">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Vercel Integration Section */}
                                    <div className="space-y-6">
                                        <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-2">
                                                    <img src={vercelLogo} alt="Vercel" className="w-full h-full" />
                                                </div>
                                                <div className={isRTL ? 'text-right' : ''}>
                                                    <h3 className="text-lg font-semibold text-white">Vercel</h3>
                                                    <p className="text-sm text-white/50">{t('integrations.vercelDesc')}</p>
                                                </div>
                                            </div>
                                            {integrations?.vercel_connected ? (
                                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                    {t('integrations.connected')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-white/40 border-white/10">
                                                    {t('integrations.notConnected')}
                                                </Badge>
                                            )}
                                        </div>

                                        {integrations?.vercel_connected ? (
                                            <div className={`flex items-center justify-between p-3 bg-white/5 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xs">
                                                        {integrations.vercel_username?.[0].toUpperCase()}
                                                    </div>
                                                    <div className={isRTL ? 'text-right' : ''}>
                                                        <p className="text-sm font-medium text-white">{integrations.vercel_username}</p>
                                                        <p className="text-xs text-white/40">Connected via API Token</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={disconnectVercel}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                >
                                                    {t('integrations.disconnect')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="vercel-token" className="text-white/80">{t('integrations.vercelToken')}</Label>
                                                        <a
                                                            href="https://vercel.com/account/tokens"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                                        >
                                                            {t('integrations.getVercelToken')}
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            id="vercel-token"
                                                            type={showVercelToken ? 'text' : 'password'}
                                                            placeholder="Enter your Vercel API token"
                                                            value={vercelToken}
                                                            onChange={(e) => setVercelToken(e.target.value)}
                                                            dir="ltr"
                                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10 focus:border-purple-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowVercelToken(!showVercelToken)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                                                        >
                                                            {showVercelToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={handleSaveVercel}
                                                    disabled={savingVercel || !vercelToken.trim()}
                                                    className="w-full bg-white text-black hover:bg-white/90"
                                                >
                                                    {savingVercel ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            {t('common.loading')}
                                                        </>
                                                    ) : (
                                                        t('integrations.connectVercel')
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
