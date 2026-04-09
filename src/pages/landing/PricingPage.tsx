import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/components/landing/PublicLayout';

const plans = [
  {
    name: 'Starter',
    price: '₹0',
    period: 'forever',
    desc: 'Perfect for small schools getting started with digital management.',
    features: ['Up to 200 students', 'Student & Staff management', 'Attendance tracking', 'Fee collection (offline)', 'Basic reports', 'Email support'],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '₹4,999',
    period: '/month',
    desc: 'For growing institutions needing advanced modules and integrations.',
    features: ['Up to 2,000 students', 'Everything in Starter', 'Online fee payments', 'Examinations & marks', 'Timetable generator', 'Library & Hostel', 'Transport management', 'Priority support'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For universities and multi-branch institutions with custom needs.',
    features: ['Unlimited students', 'Everything in Professional', 'Multi-branch support', 'Custom integrations', 'Dedicated account manager', 'On-premise option', 'SLA guarantee', '24/7 phone support'],
    cta: 'Talk to Sales',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[hsl(260,80%,60%)]/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-extrabold sm:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`relative overflow-hidden rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-[hsl(221,80%,56%)]/50 bg-gradient-to-b from-[hsl(221,80%,56%)]/10 to-transparent'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(221,80%,56%)] to-transparent" />
                )}
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-white/40">{plan.period}</span>}
                </div>
                <p className="mt-3 text-sm text-white/40">{plan.desc}</p>

                <Link to={plan.name === 'Enterprise' ? '/contact' : '/register'} className="block mt-6">
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-[hsl(221,80%,56%)] to-[hsl(260,80%,60%)] text-white border-0 hover:opacity-90'
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                    }`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm text-white/60">
                      <Check className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
