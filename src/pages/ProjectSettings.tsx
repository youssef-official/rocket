import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Lock, Globe, EyeOff, Volume2, VolumeX, Bell, BellOff, Stamp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlan, PLAN_CONFIG } from '@/hooks/useUserPlan';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const ProjectSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userPlan } = useUserPlan();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [watermarkRemoved, setWatermarkRemoved] = useState(false);

  // Local preferences (stored in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem(`project_sound_${id}`) !== 'false';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem(`project_notifications_${id}`) !== 'false';
  });

  const isPaid = userPlan ? (PLAN_CONFIG[userPlan.plan] || PLAN_CONFIG.free).features.watermarkRemoval : false;

  useEffect(() => {
    if (!id || !user) return;
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('name, is_public')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast({ title: 'Error', description: 'Project not found', variant: 'destructive' });
        navigate('/dashboard');
        return;
      }
      setProjectName(data.name);
      setIsPublic(data.is_public);
      setWatermarkRemoved(localStorage.getItem(`project_watermark_${id}`) === 'removed');
      setLoading(false);
    };
    fetchProject();
  }, [id, user]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);

    const { error } = await supabase
      .from('projects')
      .update({ name: projectName, is_public: isPublic })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } else {
      // Save local preferences
      localStorage.setItem(`project_sound_${id}`, soundEnabled ? 'true' : 'false');
      localStorage.setItem(`project_notifications_${id}`, notificationsEnabled ? 'true' : 'false');
      if (isPaid) {
        localStorage.setItem(`project_watermark_${id}`, watermarkRemoved ? 'removed' : 'visible');
      }
      toast({ title: 'Saved!', description: 'Project settings updated successfully.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundImage: `url(${spaceHeroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <VivoraXLogo size="sm" />
          </a>
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>
        </div>
      </header>

      <main className="relative z-10 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white mb-2">Project Settings</h1>
            <p className="text-white/50 text-sm mb-10">Manage your project preferences and visibility.</p>
          </motion.div>

          <div className="space-y-6">
            {/* Project Name */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <Label className="text-white/80 text-sm font-semibold mb-3 block">Project Name</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50"
                placeholder="My Awesome Project"
              />
            </motion.div>

            {/* Visibility */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPublic ? <Globe className="w-5 h-5 text-green-400" /> : <EyeOff className="w-5 h-5 text-purple-400" />}
                  <div>
                    <p className="text-white font-semibold text-sm">Project Visibility</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {isPublic ? 'Anyone can view this project' : 'Only you can access this project'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!isPaid && !isPublic ? null : (
                    <span className="text-xs text-white/40">{isPublic ? 'Public' : 'Private'}</span>
                  )}
                  {isPaid ? (
                    <Switch checked={!isPublic} onCheckedChange={(checked) => setIsPublic(!checked)} />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-yellow-400" />
                      <a href="/pricing" className="text-xs text-purple-400 hover:underline">Pro+</a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Watermark */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Stamp className="w-5 h-5 text-pink-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">Remove Watermark</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      Hide the "Built with Vivora X" badge from your project
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isPaid ? (
                    <Switch checked={watermarkRemoved} onCheckedChange={setWatermarkRemoved} />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-yellow-400" />
                      <a href="/pricing" className="text-xs text-purple-400 hover:underline">Pro+</a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Sound */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-400" /> : <VolumeX className="w-5 h-5 text-white/30" />}
                  <div>
                    <p className="text-white font-semibold text-sm">Generation Sound</p>
                    <p className="text-white/40 text-xs mt-0.5">Play a sound when code generation completes</p>
                  </div>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {notificationsEnabled ? <Bell className="w-5 h-5 text-orange-400" /> : <BellOff className="w-5 h-5 text-white/30" />}
                  <div>
                    <p className="text-white font-semibold text-sm">Notifications</p>
                    <p className="text-white/40 text-xs mt-0.5">Receive messages and alerts for this project</p>
                  </div>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="pt-2"
            >
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectSettings;
