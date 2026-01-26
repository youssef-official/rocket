import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Star, Crown, ArrowLeft } from 'lucide-react';
import { RocketLogo } from '@/components/shared/RocketLogo';
import spaceHeroBg from '@/assets/space-hero-bg.jpg';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out Rocket',
    icon: Zap,
    features: [
      '5 projects per month',
      'Basic AI code generation',
      'Community support',
      'Public projects only',
      'Standard templates',
    ],
    buttonText: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For professional developers',
    icon: Star,
    features: [
      'Unlimited projects',
      'Advanced AI generation',
      'Priority support',
      'Private projects',
      'Premium templates',
      'Custom domains',
      'Version history',
      'Team collaboration',
    ],
    buttonText: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For teams and organizations',
    icon: Crown,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'SSO authentication',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
      'Advanced analytics',
    ],
    buttonText: 'Contact Sales',
    popular: false,
  },
];

export const Pricing: React.FC = () => {
  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${spaceHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <RocketLogo size="md" />
          </a>
          <a 
            href="/"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Simple, Transparent <span className="text-pink-400">Pricing</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Choose the plan that's right for you and start building amazing projects today.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white/10 backdrop-blur-md rounded-2xl border ${
                  plan.popular ? 'border-pink-400' : 'border-white/10'
                } p-6 overflow-hidden`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.popular ? 'bg-pink-500/20' : 'bg-white/10'
                  }`}>
                    <plan.icon className={`w-5 h-5 ${plan.popular ? 'text-pink-400' : 'text-white'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/60">{plan.period}</span>
                </div>

                <p className="text-white/70 mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-white/80">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    plan.popular
                      ? 'bg-pink-500 hover:bg-pink-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-white/70 mb-8">
              Have questions? We're here to help.
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
              {[
                {
                  q: 'Can I upgrade or downgrade my plan?',
                  a: 'Yes, you can change your plan at any time. Changes take effect immediately.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Yes, Pro plan comes with a 14-day free trial. No credit card required.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise.',
                },
                {
                  q: 'Can I cancel anytime?',
                  a: 'Absolutely. You can cancel your subscription at any time with no questions asked.',
                },
              ].map((faq) => (
                <div key={faq.q} className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-white/70 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
