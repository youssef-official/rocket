import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { VivoraXLogo } from '@/components/shared/VivoraXLogo';
import heroImg from '@/assets/hero-bg.webp';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<'login' | 'signup' | 'check-email'>('login');
  const [email, setEmail] = useState('');
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
        const { error } = await signUp(email, password);
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

          <nav className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-1">
            <button className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm">
              Pricing
            </button>
            <button className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm">
              Careers
            </button>
            <button className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm flex items-center gap-1">
              Resources
              <ArrowRight className="w-3 h-3 rotate-90" />
            </button>
          </nav>

          <div className="w-24" /> {/* Spacer for balance */}
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
            <img 
              src={heroImg} 
              alt="Hero" 
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

                  {/* Google Button */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-800 transition-colors mb-6"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-500">OR</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      minLength={6}
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
                    <a href="#" className="text-gray-900 underline">Terms</a> and{' '}
                    <a href="#" className="text-gray-900 underline">Privacy Policy</a>.
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