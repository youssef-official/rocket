import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
const authVideo = '/videos/vivora-auth-video.mp4';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<'login' | 'signup' | 'check-email'>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      if (view === 'signup') {
        const { error } = await signUp(email, password, displayName || undefined, phone || undefined);
        if (error) throw error;
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        onSuccess();
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      let message = err.message || 'Authentication failed';
      if (message.includes('Email not confirmed')) {
        message = 'Please check your email to confirm your account before logging in.';
      } else if (message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please try again.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${spaceHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <VivoraXLogo size="md" onClick={() => window.location.href = '/'} />

          <div className="w-9" aria-hidden="true" />
        </div>
      </header>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-20 w-full max-w-4xl"
      >
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex">
          {/* Left - Image */}
          <div className="hidden lg:block w-1/2 relative">
            <video 
              src={authVideo} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Build faster with AI
              </h2>
              <p className="text-white/80">
                Create production-ready web apps in minutes, not hours.
              </p>
            </div>
          </div>

          {/* Right - Form */}
          <div className="w-full lg:w-1/2 p-8 md:p-12">
            {/* Logo for mobile */}
            <div className="lg:hidden flex justify-center mb-8">
              <VivoraXLogo size="lg" />
            </div>

            <AnimatePresence mode="wait">
              {view === 'check-email' ? (
                <motion.div
                  key="check-email"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center pt-8"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                  <p className="text-gray-600 mb-8">
                    We've sent a verification link to{' '}
                    <span className="font-medium text-gray-900">{email}</span>
                  </p>
                  <button
                    onClick={() => setView('login')}
                    className="w-full py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    Return to Sign In
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="auth-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    {view === 'login' ? 'Welcome back' : 'Create account'}
                  </h1>
                  <p className="text-gray-600 text-center mb-8">
                    {view === 'login' 
                      ? 'Sign in to continue building amazing projects'
                      : 'Start building your projects with AI'}
                  </p>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {view === 'signup' && <><input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-gray-800 placeholder-gray-500"
                    /><input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number (e.g. +20 10 0000 0000)"
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-gray-800 placeholder-gray-500"
                      minLength={7}
                      required
                    /></>}
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-gray-800 placeholder-gray-500"
                      required
                    />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-gray-800 placeholder-gray-500"
                      required
                      minLength={10}
                    />

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        view === 'login' ? 'Sign In' : 'Create Account'
                      )}
                    </button>
                  </form>

                  {/* Toggle view */}
                  <p className="text-sm text-gray-600 text-center mt-6">
                    {view === 'login' ? (
                      <>
                        Don't have an account?{' '}
                        <button
                          onClick={() => setView('signup')}
                          className="text-primary font-medium hover:underline"
                        >
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button
                          onClick={() => setView('login')}
                          className="text-primary font-medium hover:underline"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </p>

                  {/* Terms */}
                  <p className="text-xs text-gray-500 text-center mt-6">
                    By continuing, you agree to our{' '}
                    <a href="/terms" className="text-gray-900 underline">Terms</a> and{' '}
                    <a href="/privacy" className="text-gray-900 underline">Privacy Policy</a>.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
