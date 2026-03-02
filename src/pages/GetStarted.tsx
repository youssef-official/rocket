import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sun, Moon, User, Users, Building2, Briefcase, Code2, Palette, Target, Settings, BarChart3, Megaphone, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { VivoraLogo } from '@/components/shared/VivoraLogo';

/* ============================
   Types
============================ */
interface OnboardingData {
    theme: 'light' | 'dark' | null;
    fullName: string;
    role: string | null;
    companySize: string | null;
}

/* ============================
   Step Indicator
============================ */
const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => (
    <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
                key={i}
                className="rounded-full"
                animate={{
                    width: i === currentStep ? 28 : 8,
                    height: 8,
                    backgroundColor: i === currentStep ? '#ffffff' : 'rgba(255,255,255,0.3)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
        ))}
    </div>
);

/* ============================
   Role Data
============================ */
const roles = [
    { id: 'founder', label: 'Founder', icon: Briefcase },
    { id: 'product', label: 'Product', icon: Target },
    { id: 'designer', label: 'Designer', icon: Palette },
    { id: 'engineer', label: 'Engineer', icon: Code2 },
    { id: 'consultant', label: 'Consultant', icon: BarChart3 },
    { id: 'marketing', label: 'Marketing / Sales', icon: Megaphone },
    { id: 'operations', label: 'Operations', icon: Settings },
    { id: 'other', label: 'Other', icon: HelpCircle },
];

const companySizes = [
    { id: 'solo', label: 'Solo', icon: User },
    { id: '2-20', label: '2 - 20', icon: Users },
    { id: '21-200', label: '21 - 200', icon: Users },
    { id: '200+', label: '200+', icon: Building2 },
];

/* ============================
   Slide Variants
============================ */
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.95,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0,
        scale: 0.95,
    }),
};

/* ============================
   Main Component
============================ */
const GetStarted: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        theme: null,
        fullName: '',
        role: null,
        companySize: null,
    });

    const totalSteps = 4;

    /* --- navigation helpers --- */
    const goNext = useCallback(() => {
        if (currentStep < totalSteps - 1) {
            setDirection(1);
            setCurrentStep((s) => s + 1);
        }
    }, [currentStep]);

    const handleFinish = useCallback(async () => {
        setIsSubmitting(true);

        // Apply theme immediately
        if (data.theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }

        // Save onboarding data to Supabase user_metadata
        if (user) {
            try {
                await supabase.auth.updateUser({
                    data: {
                        display_name: data.fullName || user.displayName || user.email?.split('@')[0],
                        onboarding_completed: true,
                        role: data.role,
                        company_size: data.companySize,
                        preferred_theme: data.theme,
                    },
                });
            } catch (e) {
                console.error('Failed to save onboarding data:', e);
            }
        }

        // Mark onboarding complete in localStorage as fallback
        localStorage.setItem('onboarding_completed', 'true');

        setIsSubmitting(false);
        navigate('/');
    }, [data, user, navigate]);

    /* --- option selector helper --- */
    const selectOption = useCallback(
        (field: keyof OnboardingData, value: string) => {
            setData((prev) => ({ ...prev, [field]: value }));
            // Auto-advance for selection-based steps
            setTimeout(() => {
                if (field === 'companySize') {
                    // last step – finish
                    return;
                }
                setDirection(1);
                setCurrentStep((s) => s + 1);
            }, 350);
        },
        []
    );

    /* ============================
       Step 1: Pick your style
    ============================ */
    const StepTheme = (
        <motion.div
            key="step-theme"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col items-center gap-8"
        >
            <VivoraLogo size="lg" showText={false} />

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Pick your style
            </h1>

            <div className="flex gap-6">
                {/* Light */}
                <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectOption('theme', 'light')}
                    className={`
            relative flex flex-col items-center gap-3 p-1 rounded-2xl border-2 transition-all duration-300
            ${data.theme === 'light'
                            ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.25)]'
                            : 'border-white/10 hover:border-white/30'
                        }
          `}
                >
                    <div className="w-[140px] h-[100px] rounded-xl bg-[#f5f0e8] overflow-hidden p-3 flex gap-2">
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="w-full h-2 rounded bg-[#e0d5c5]" />
                            <div className="w-3/4 h-2 rounded bg-[#e0d5c5]" />
                            <div className="w-1/2 h-2 rounded bg-[#e0d5c5]" />
                        </div>
                        <div className="w-8 h-full rounded bg-[#ebe3d8]" />
                        <div className="absolute top-3 left-4">
                            <div className="w-3 h-3">
                                <VivoraLogo size="sm" showText={false} />
                            </div>
                        </div>
                    </div>
                    <span className="text-sm text-white/80 font-medium pb-2">Light</span>
                </motion.button>

                {/* Dark */}
                <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectOption('theme', 'dark')}
                    className={`
            relative flex flex-col items-center gap-3 p-1 rounded-2xl border-2 transition-all duration-300
            ${data.theme === 'dark'
                            ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.25)]'
                            : 'border-white/10 hover:border-white/30'
                        }
          `}
                >
                    <div className="w-[140px] h-[100px] rounded-xl bg-[#1a1a2e] overflow-hidden p-3 flex gap-2">
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="w-full h-2 rounded bg-[#2a2a40]" />
                            <div className="w-3/4 h-2 rounded bg-[#2a2a40]" />
                            <div className="w-1/2 h-2 rounded bg-[#2a2a40]" />
                        </div>
                        <div className="w-8 h-full rounded bg-[#222238]" />
                        <div className="absolute top-3 left-4">
                            <div className="w-3 h-3">
                                <VivoraLogo size="sm" showText={false} />
                            </div>
                        </div>
                    </div>
                    <span className="text-sm text-white/80 font-medium pb-2">Dark</span>
                </motion.button>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                disabled={!data.theme}
                className={`
          flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
          ${data.theme
                        ? 'bg-white text-black shadow-lg hover:shadow-xl'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }
        `}
            >
                Next <ArrowRight size={16} />
            </motion.button>
        </motion.div>
    );

    /* ============================
       Step 2: What's your name?
    ============================ */
    const StepName = (
        <motion.div
            key="step-name"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col items-center gap-8"
        >
            <VivoraLogo size="lg" showText={false} />

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                What's your name?
            </h1>

            <div className="w-full max-w-md flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Full name</label>
                <input
                    id="onboarding-name-input"
                    type="text"
                    value={data.fullName}
                    onChange={(e) => setData((p) => ({ ...p, fullName: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && data.fullName.trim() && goNext()}
                    placeholder="Enter your name"
                    autoFocus
                    className="
            w-full px-4 py-3 rounded-xl
            bg-white/95 text-black placeholder:text-gray-400
            border-0 outline-none
            text-base font-medium
            transition-shadow
            focus:shadow-[0_0_0_3px_rgba(255,255,255,0.3)]
          "
                />
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                disabled={!data.fullName.trim()}
                className={`
          flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
          ${data.fullName.trim()
                        ? 'bg-white text-black shadow-lg hover:shadow-xl'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }
        `}
            >
                Next <ArrowRight size={16} />
            </motion.button>
        </motion.div>
    );

    /* ============================
       Step 3: Which role fits you best?
    ============================ */
    const StepRole = (
        <motion.div
            key="step-role"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col items-center gap-8"
        >
            <VivoraLogo size="lg" showText={false} />

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Which role fits you best?
            </h1>

            <div className="grid grid-cols-4 gap-3 max-w-[600px]">
                {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = data.role === role.id;
                    return (
                        <motion.button
                            key={role.id}
                            whileHover={{ scale: 1.06, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => selectOption('role', role.id)}
                            className={`
                flex flex-col items-center justify-center gap-2.5
                w-[120px] h-[100px] rounded-xl border-2 transition-all duration-300
                ${isSelected
                                    ? 'border-white bg-white/15 shadow-[0_0_25px_rgba(255,255,255,0.2)]'
                                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                                }
              `}
                        >
                            <Icon size={22} className="text-white/80" />
                            <span className="text-xs text-white/80 font-medium">{role.label}</span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );

    /* ============================
       Step 4: How many people work at your company?
    ============================ */
    const StepCompany = (
        <motion.div
            key="step-company"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col items-center gap-8"
        >
            <VivoraLogo size="lg" showText={false} />

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                How many people work at your company?
            </h1>

            <div className="flex gap-3">
                {companySizes.map((size) => {
                    const Icon = size.icon;
                    const isSelected = data.companySize === size.id;

                    // Render different dot icons based on company size
                    const renderSizeIcon = () => {
                        switch (size.id) {
                            case 'solo':
                                return (
                                    <div className="flex items-center justify-center w-6 h-6">
                                        <div className="w-2.5 h-2.5 rounded-full border-2 border-white/60" />
                                    </div>
                                );
                            case '2-20':
                                return (
                                    <div className="grid grid-cols-2 gap-1 w-6 h-6 place-items-center">
                                        <div className="w-2 h-2 rounded-full bg-white/60" />
                                        <div className="w-2 h-2 rounded-full bg-white/60" />
                                        <div className="w-2 h-2 rounded-full bg-white/60" />
                                        <div className="w-2 h-2 rounded-full bg-white/60" />
                                    </div>
                                );
                            case '21-200':
                                return (
                                    <div className="grid grid-cols-3 gap-0.5 w-6 h-6 place-items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                    </div>
                                );
                            case '200+':
                                return (
                                    <div className="grid grid-cols-3 gap-0.5 w-6 h-6 place-items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                    </div>
                                );
                            default:
                                return <Icon size={22} className="text-white/60" />;
                        }
                    };

                    return (
                        <motion.button
                            key={size.id}
                            whileHover={{ scale: 1.06, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setData((p) => ({ ...p, companySize: size.id }));
                                // Don't auto-advance on last step, wait for manual finish
                            }}
                            className={`
                flex flex-col items-center justify-center gap-3
                w-[120px] h-[110px] rounded-xl border-2 transition-all duration-300
                ${isSelected
                                    ? 'border-white bg-white/15 shadow-[0_0_25px_rgba(255,255,255,0.2)]'
                                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                                }
              `}
                        >
                            {renderSizeIcon()}
                            <span className="text-sm text-white/80 font-medium">{size.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleFinish}
                disabled={!data.companySize || isSubmitting}
                className={`
          flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300
          ${data.companySize && !isSubmitting
                        ? 'bg-white text-black shadow-lg hover:shadow-xl'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }
        `}
            >
                {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        Get Started <ArrowRight size={16} />
                    </>
                )}
            </motion.button>
        </motion.div>
    );

    const steps = [StepTheme, StepName, StepRole, StepCompany];

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#0d0d0d] flex flex-col items-center justify-center">
            {/* === Aurora Gradient Background === */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Base dark gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d] via-[#0d0d0d] to-transparent z-[1]" />

                {/* Pink aurora glow */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.6, 0.8, 0.6],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px]"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.7) 0%, rgba(219,39,119,0.4) 30%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />

                {/* Blue aurora glow - left */}
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        x: [-20, 20, -20],
                        opacity: [0.5, 0.7, 0.5],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-20 left-[10%] w-[500px] h-[350px]"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.6) 0%, rgba(37,99,235,0.3) 40%, transparent 70%)',
                        filter: 'blur(50px)',
                    }}
                />

                {/* Blue aurora glow - right */}
                <motion.div
                    animate={{
                        scale: [1, 1.12, 1],
                        x: [20, -20, 20],
                        opacity: [0.5, 0.65, 0.5],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-20 right-[10%] w-[500px] h-[350px]"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.6) 0%, rgba(37,99,235,0.3) 40%, transparent 70%)',
                        filter: 'blur(50px)',
                    }}
                />

                {/* Purple accent */}
                <motion.div
                    animate={{
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px]"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.4) 0%, transparent 60%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            {/* === Content === */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-3xl px-6 py-12">
                <AnimatePresence mode="wait" custom={direction}>
                    {steps[currentStep]}
                </AnimatePresence>
            </div>

            {/* === Step Indicator === */}
            <div className="relative z-10 pb-10">
                <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
            </div>

            {/* === Skip button === */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => {
                    localStorage.setItem('onboarding_completed', 'true');
                    navigate('/');
                }}
                className="absolute top-6 right-6 z-20 text-white/30 hover:text-white/60 text-sm font-medium transition-colors"
            >
                Skip
            </motion.button>
        </div>
    );
};

export default GetStarted;
