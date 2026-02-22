import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings as SettingsIcon,
    Loader2, Key, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import vercelLogo from '@/assets/logos/vercel.svg';
import githubLogo from '@/assets/logos/github.svg';

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
        saveGitHubToken,
        disconnectVercel,
        disconnectGitHub,
    } = useIntegrations();

    const [vercelToken, setVercelToken] = useState('');
    const [githubToken, setGitHubToken] = useState('');
    const [savingVercel, setSavingVercel] = useState(false);
    const [savingGitHub, setSavingGitHub] = useState(false);
    const [showVercelToken, setShowVercelToken] = useState(false);
    const [showGitHubToken, setShowGitHubToken] = useState(false);

    const handleSaveVercel = async () => {
        if (!vercelToken.trim()) return;
        setSavingVercel(true);
        const success = await saveVercelToken(vercelToken.trim());
        setSavingVercel(false);
        if (success) setVercelToken('');
    };

    const handleSaveGitHub = async () => {
        if (!githubToken.trim()) return;
        setSavingGitHub(true);
        const success = await saveGitHubToken(githubToken.trim());
        setSavingGitHub(false);
        if (success) setGitHubToken('');
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
                                    <TokenIntegrationCard
                                        logo={vercelLogo}
                                        name="Vercel"
                                        description={t('integrations.vercelDesc')}
                                        connected={!!integrations?.vercel_connected}
                                        username={integrations?.vercel_username}
                                        tokenValue={vercelToken}
                                        onTokenChange={setVercelToken}
                                        onSave={handleSaveVercel}
                                        onDisconnect={disconnectVercel}
                                        saving={savingVercel}
                                        showToken={showVercelToken}
                                        onToggleShow={() => setShowVercelToken(!showVercelToken)}
                                        placeholder="Enter your Vercel Access Token"
                                        helpUrl="https://vercel.com/account/tokens"
                                        helpText="Get token from Vercel → Settings → Tokens"
                                        isRTL={isRTL}
                                        logoClassName="dark:invert"
                                        t={t}
                                    />

                                    {/* GitHub Integration */}
                                    <TokenIntegrationCard
                                        logo={githubLogo}
                                        name="GitHub"
                                        description="Push your projects to GitHub repositories"
                                        connected={!!integrations?.github_connected}
                                        username={integrations?.github_username}
                                        tokenValue={githubToken}
                                        onTokenChange={setGitHubToken}
                                        onSave={handleSaveGitHub}
                                        onDisconnect={disconnectGitHub}
                                        saving={savingGitHub}
                                        showToken={showGitHubToken}
                                        onToggleShow={() => setShowGitHubToken(!showGitHubToken)}
                                        placeholder="Enter your GitHub Personal Access Token"
                                        helpUrl="https://github.com/settings/tokens/new"
                                        helpText="Get token from GitHub → Settings → Developer settings → Personal access tokens"
                                        isRTL={isRTL}
                                        logoClassName="dark:invert"
                                        t={t}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Token-based integration card
const TokenIntegrationCard: React.FC<{
    logo: string;
    name: string;
    description: string;
    connected: boolean;
    username?: string | null;
    tokenValue: string;
    onTokenChange: (val: string) => void;
    onSave: () => void;
    onDisconnect: () => Promise<boolean>;
    saving: boolean;
    showToken: boolean;
    onToggleShow: () => void;
    placeholder: string;
    helpUrl: string;
    helpText: string;
    isRTL: boolean;
    logoClassName?: string;
    t: (key: string) => string;
}> = ({ logo, name, description, connected, username, tokenValue, onTokenChange, onSave, onDisconnect, saving, showToken, onToggleShow, placeholder, helpUrl, helpText, isRTL, logoClassName, t }) => (
    <div className="space-y-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-2">
                    <img src={logo} alt={name} className={`w-full h-full ${logoClassName || ''}`} />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                    <h3 className="text-lg font-semibold text-white">{name}</h3>
                    <p className="text-sm text-white/50">{description}</p>
                </div>
            </div>
            {connected ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {t('integrations.connected')}
                </Badge>
            ) : (
                <Badge variant="outline" className="text-white/40 border-white/10">
                    {t('integrations.notConnected')}
                </Badge>
            )}
        </div>

        {connected ? (
            <div className={`flex items-center justify-between p-3 bg-white/5 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                        {username?.[0]?.toUpperCase() || name[0]}
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                        <p className="text-sm font-medium text-white">{username}</p>
                        <p className="text-xs text-white/40">Connected via Token</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDisconnect}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                    {t('integrations.disconnect')}
                </Button>
            </div>
        ) : (
            <div className="space-y-3">
                <div className="relative">
                    <Input
                        type={showToken ? 'text' : 'password'}
                        value={tokenValue}
                        onChange={(e) => onTokenChange(e.target.value)}
                        placeholder={placeholder}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10"
                        onKeyDown={(e) => e.key === 'Enter' && onSave()}
                    />
                    <button
                        type="button"
                        onClick={onToggleShow}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <a
                        href={helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                    >
                        {helpText}
                    </a>
                </div>
                <Button
                    onClick={onSave}
                    disabled={saving || !tokenValue.trim()}
                    className="w-full bg-white text-black hover:bg-white/90 gap-2"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Key className="w-4 h-4" />
                    )}
                    Connect {name}
                </Button>
            </div>
        )}
    </div>
);
