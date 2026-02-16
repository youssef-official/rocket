import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings as SettingsIcon,
    Loader2, ExternalLink, LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        startVercelOAuth,
        disconnectVercel
    } = useIntegrations();

    const [connectingVercel, setConnectingVercel] = useState(false);

    const handleConnectVercel = async () => {
        setConnectingVercel(true);
        await startVercelOAuth();
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
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%)',
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
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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
                                    {/* Vercel Integration */}
                                    <div className="space-y-6">
                                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
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
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                                                        {integrations.vercel_username?.[0]?.toUpperCase() || 'V'}
                                                    </div>
                                                    <div className={isRTL ? 'text-right' : ''}>
                                                        <p className="text-sm font-medium text-white">{integrations.vercel_username}</p>
                                                        <p className="text-xs text-white/40">{isRTL ? 'متصل عبر OAuth' : 'Connected via OAuth'}</p>
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
                                            <Button
                                                onClick={handleConnectVercel}
                                                disabled={connectingVercel}
                                                className="w-full bg-white text-black hover:bg-white/90 gap-2"
                                            >
                                                {connectingVercel ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <LogIn className="w-4 h-4" />
                                                )}
                                                {isRTL ? 'تسجيل الدخول بـ Vercel' : 'Sign in with Vercel'}
                                            </Button>
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
