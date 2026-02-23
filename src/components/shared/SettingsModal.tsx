import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Loader2, Key, Eye, EyeOff, ExternalLink, Shield, Unplug, CheckCircle2, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
                    <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(1,4,9,0.75)' }} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl"
                        style={{
                            background: '#0d1117',
                            border: '1px solid #21262d',
                        }}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #21262d', background: '#010409' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,139,253,0.12)', border: '1px solid rgba(56,139,253,0.2)' }}>
                                    <Shield className="w-4 h-4" style={{ color: '#58a6ff' }} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold" style={{ color: '#e1e4e8' }}>Account Settings</h2>
                                    <p className="text-xs" style={{ color: '#484f58' }}>{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: '#484f58' }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#161b22'; (e.currentTarget as HTMLElement).style.color = '#e1e4e8'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#484f58'; }}
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-72px)] no-scrollbar">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#484f58' }} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Section Label */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <Link2 className="w-3.5 h-3.5" style={{ color: '#484f58' }} />
                                        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#484f58' }}>Integrations</span>
                                    </div>

                                    {/* Vercel */}
                                    <IntegrationCard
                                        logo={vercelLogo}
                                        name="Vercel"
                                        description="Deploy your projects to Vercel with one click"
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
                                        helpText="Get your token"
                                        logoInvert
                                    />

                                    {/* GitHub */}
                                    <IntegrationCard
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
                                        helpText="Create a token"
                                        logoInvert
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

// ─── Integration Card ─────────────────────────────────────────────────────────
const IntegrationCard: React.FC<{
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
    logoInvert?: boolean;
}> = ({ logo, name, description, connected, username, tokenValue, onTokenChange, onSave, onDisconnect, saving, showToken, onToggleShow, placeholder, helpUrl, helpText, logoInvert }) => {
    const [disconnecting, setDisconnecting] = useState(false);

    const handleDisconnect = async () => {
        setDisconnecting(true);
        await onDisconnect();
        setDisconnecting(false);
    };

    return (
        <div
            className="rounded-xl overflow-hidden transition-colors"
            style={{ background: '#161b22', border: '1px solid #21262d' }}
        >
            {/* Card Header */}
            <div className="flex items-center gap-3.5 px-4 py-3.5" style={{ borderBottom: connected ? '1px solid #21262d' : 'none' }}>
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#21262d', border: '1px solid #30363d' }}
                >
                    <img src={logo} alt={name} className={`w-5 h-5 ${logoInvert ? 'dark:invert' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold" style={{ color: '#e1e4e8' }}>{name}</h3>
                        {connected && (
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                style={{ background: 'rgba(63,185,80,0.12)', color: '#3fb950', border: '1px solid rgba(63,185,80,0.2)' }}
                            >
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Connected
                            </span>
                        )}
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: '#484f58' }}>{description}</p>
                </div>
            </div>

            {connected ? (
                /* Connected State */
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg, #388bfd, #a371f7)', color: '#fff' }}
                        >
                            {username?.[0]?.toUpperCase() || name[0]}
                        </div>
                        <div>
                            <p className="text-[13px] font-medium" style={{ color: '#c9d1d9' }}>{username}</p>
                            <p className="text-[11px]" style={{ color: '#484f58' }}>Connected via Token</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                        style={{ color: '#f85149', background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.15)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,81,73,0.15)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,81,73,0.08)'; }}
                    >
                        {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unplug className="w-3 h-3" />}
                        Disconnect
                    </button>
                </div>
            ) : (
                /* Disconnected State - Token Input */
                <div className="px-4 pb-4 pt-1 space-y-3">
                    <div className="relative">
                        <Input
                            type={showToken ? 'text' : 'password'}
                            value={tokenValue}
                            onChange={(e) => onTokenChange(e.target.value)}
                            placeholder={placeholder}
                            className="h-10 text-[13px] pr-10 rounded-lg font-mono"
                            style={{
                                background: '#0d1117',
                                border: '1px solid #30363d',
                                color: '#c9d1d9',
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && onSave()}
                        />
                        <button
                            type="button"
                            onClick={onToggleShow}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                            style={{ color: '#484f58' }}
                        >
                            {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <a
                            href={helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                            style={{ color: '#58a6ff' }}
                        >
                            <ExternalLink className="w-3 h-3" />
                            {helpText}
                        </a>
                        <Button
                            onClick={onSave}
                            disabled={saving || !tokenValue.trim()}
                            size="sm"
                            className="h-8 px-4 rounded-lg text-[12px] font-semibold gap-1.5"
                            style={{
                                background: '#388bfd',
                                color: '#fff',
                            }}
                        >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
                            Connect
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
