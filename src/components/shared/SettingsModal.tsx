import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Github, Settings as SettingsIcon, User,
    Check, Loader2, Eye, EyeOff, ExternalLink, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
        saveGitHubToken,
        saveVercelToken,
        disconnectGitHub,
        disconnectVercel
    } = useIntegrations();

    const [activeTab, setActiveTab] = useState<'profile' | 'integrations'>('profile');
    const [githubToken, setGithubToken] = useState('');
    const [vercelToken, setVercelToken] = useState('');
    const [showGithubToken, setShowGithubToken] = useState(false);
    const [showVercelToken, setShowVercelToken] = useState(false);
    const [savingGithub, setSavingGithub] = useState(false);
    const [savingVercel, setSavingVercel] = useState(false);

    // Profile editing
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Load profile data
    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return;

            const { data } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setDisplayName(data.display_name || '');
                setAvatarUrl(data.avatar_url || '');
            }
        };

        if (isOpen) {
            loadProfile();
        }
    }, [user, isOpen]);

    const handleSaveProfile = async () => {
        if (!user) return;

        setSavingProfile(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName.trim() || null,
                    avatar_url: avatarUrl.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;

            toast({
                title: t('common.success'),
                description: t('settings.profileUpdated'),
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: t('common.error'),
                description: 'Failed to update profile',
                variant: 'destructive',
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveGitHub = async () => {
        if (!githubToken.trim()) return;
        setSavingGithub(true);
        const success = await saveGitHubToken(githubToken.trim());
        if (success) setGithubToken('');
        setSavingGithub(false);
    };

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

                        {/* Tab Navigation */}
                        <div className={`flex gap-1 p-4 border-b border-white/10 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isRTL ? 'flex-row-reverse' : ''} ${activeTab === 'profile'
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                {t('settings.profile')}
                            </button>
                            <button
                                onClick={() => setActiveTab('integrations')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isRTL ? 'flex-row-reverse' : ''} ${activeTab === 'integrations'
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Github className="w-4 h-4" />
                                {t('footer.integrations')}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                                </div>
                            ) : activeTab === 'profile' ? (
                                <div className="space-y-6">
                                    {/* Avatar Preview */}
                                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div className="relative">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt="Avatar"
                                                    className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                                                    <User className="w-8 h-8 text-white/40" />
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                                <Camera className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor="avatar-url" className="text-white/80">{t('settings.avatarUrl')}</Label>
                                            <Input
                                                id="avatar-url"
                                                type="url"
                                                placeholder="https://example.com/avatar.jpg"
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                dir="ltr"
                                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Display Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="display-name" className="text-white/80">{t('settings.displayName')}</Label>
                                        <Input
                                            id="display-name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                                    >
                                        {savingProfile ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.loading')}</>
                                        ) : (
                                            t('settings.updateProfile')
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* GitHub Integration */}
                                    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                        <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <div className="w-10 h-10 rounded-lg bg-[#24292e] flex items-center justify-center">
                                                    <Github className="w-5 h-5 text-white" />
                                                </div>
                                                <div className={isRTL ? 'text-right' : ''}>
                                                    <h3 className="font-semibold text-white">GitHub</h3>
                                                    <p className="text-xs text-white/60">{t('editor.connectGitHub')}</p>
                                                </div>
                                            </div>
                                            {integrations?.github_connected ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Connected
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-white/60 border-white/20">
                                                    <X className="w-3 h-3 mr-1" />
                                                    Not Connected
                                                </Badge>
                                            )}
                                        </div>

                                        {integrations?.github_connected ? (
                                            <div className={`flex items-center justify-between p-3 bg-white/5 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-8 h-8 rounded-full bg-[#24292e] flex items-center justify-center">
                                                        <Github className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className={isRTL ? 'text-right' : ''}>
                                                        <p className="font-medium text-white">@{integrations.github_username}</p>
                                                        <p className="text-xs text-white/60">{t('integrations.connectedAccount')}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={disconnectGitHub}
                                                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0"
                                                >
                                                    Disconnect
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <Input
                                                        type={showGithubToken ? 'text' : 'password'}
                                                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                                        value={githubToken}
                                                        onChange={(e) => setGithubToken(e.target.value)}
                                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10"
                                                        dir="ltr"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowGithubToken(!showGithubToken)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                                    >
                                                        {showGithubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-white/50">
                                                    Create a token with <code className="bg-white/10 px-1 rounded">repo</code> scope.{' '}
                                                    <a
                                                        href="https://github.com/settings/tokens/new"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-purple-400 hover:underline inline-flex items-center gap-1"
                                                    >
                                                        Generate token <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </p>
                                                <Button
                                                    onClick={handleSaveGitHub}
                                                    disabled={!githubToken.trim() || savingGithub}
                                                    className="w-full bg-[#24292e] hover:bg-[#363d45] text-white border-0"
                                                >
                                                    {savingGithub ? (
                                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                                                    ) : (
                                                        <><Github className="w-4 h-4 mr-2" /> Connect GitHub</>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Vercel Integration */}
                                    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                        <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                                                    <img src={vercelLogo} alt="Vercel" className="w-5 h-5 invert" />
                                                </div>
                                                <div className={isRTL ? 'text-right' : ''}>
                                                    <h3 className="font-semibold text-white">Vercel</h3>
                                                    <p className="text-xs text-white/60">{t('editor.deployVercel')}</p>
                                                </div>
                                            </div>
                                            {integrations?.vercel_connected ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Connected
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-white/60 border-white/20">
                                                    <X className="w-3 h-3 mr-1" />
                                                    Not Connected
                                                </Badge>
                                            )}
                                        </div>

                                        {integrations?.vercel_connected ? (
                                            <div className={`flex items-center justify-between p-3 bg-white/5 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                                                        <img src={vercelLogo} alt="Vercel" className="w-4 h-4 invert" />
                                                    </div>
                                                    <div className={isRTL ? 'text-right' : ''}>
                                                        <p className="font-medium text-white">{integrations.vercel_username}</p>
                                                        <p className="text-xs text-white/60">{t('integrations.connectedAccount')}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={disconnectVercel}
                                                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0"
                                                >
                                                    Disconnect
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <Input
                                                        type={showVercelToken ? 'text' : 'password'}
                                                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                                                        value={vercelToken}
                                                        onChange={(e) => setVercelToken(e.target.value)}
                                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10"
                                                        dir="ltr"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowVercelToken(!showVercelToken)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                                    >
                                                        {showVercelToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-white/50">
                                                    Create a token in Vercel dashboard.{' '}
                                                    <a
                                                        href="https://vercel.com/account/tokens"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-purple-400 hover:underline inline-flex items-center gap-1"
                                                    >
                                                        Generate token <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </p>
                                                <Button
                                                    onClick={handleSaveVercel}
                                                    disabled={!vercelToken.trim() || savingVercel}
                                                    className="w-full bg-black hover:bg-gray-900 text-white border-0"
                                                >
                                                    {savingVercel ? (
                                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                                                    ) : (
                                                        <>Connect Vercel</>
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
