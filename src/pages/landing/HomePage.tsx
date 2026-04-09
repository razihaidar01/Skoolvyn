import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, Users, CreditCard, BarChart3, ShieldCheck, Bell, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/components/landing/PublicLayout';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  { icon: GraduationCap, title: 'Student Management', desc: 'Complete student lifecycle from admission to alumni tracking.' },
  { icon: Users, title: 'Staff & HR', desc: 'Staff profiles, attendance, payroll, and leave management.' },
  { icon: CreditCard, title: 'Fee Collection', desc: 'Automated fee structures, online payments, and defaulter reports.' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Real-time dashboards with actionable institutional insights.' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: '15+ roles with granular permissions for complete security.' },
  { icon: Bell, title: 'Announcements', desc: 'Targeted notifications to students, parents, and staff.' },
  { icon: BookOpen, title: 'Examinations', desc: 'Exam scheduling, marks entry, and result publishing.' },
  { icon: Calendar, title: 'Timetable', desc: 'Automated timetable generation and conflict resolution.' },
];

const stats = [
  { value: '15+', label: 'User Roles' },
  { value: '20+', label: 'Modules' },
  { value: '99.9%', label: 'Uptime' },
  { value: '₹0', label: 'Setup Cost' },
];

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[hsl(221,80%,56%)]/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-[hsl(260,80%,60%)]/15 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Now in Beta — Free for early adopters
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                The Digital System for
              </span>
              <br />
              <span className="bg-gradient-to-r from-[hsl(221,80%,56%)] to-[hsl(260,80%,60%)] bg-clip-text text-transparent">
                Modern Schools
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="mt-6 text-lg text-white/50 leading-relaxed sm:text-xl">
              Manage students, staff, fees, examinations, and more — all from one powerful platform built for Indian educational institutions.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/register">
                <Button size="lg" className="group bg-gradient-to-r from-[hsl(221,80%,56%)] to-[hsl(260,80%,60%)] text-white border-0 px-8 text-base hover:opacity-90">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 px-8 text-base">
                  Explore Features
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 py-12 sm:grid-cols-4 sm:px-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-3xl font-extrabold bg-gradient-to-r from-[hsl(221,80%,56%)] to-[hsl(260,80%,60%)] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-extrabold sm:text-4xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Everything Your Institution Needs
          </h2>
          <p className="mt-4 text-white/40 text-lg max-w-2xl mx-auto">
            A comprehensive suite of modules designed for schools, colleges, and universities across India.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(221,80%,56%)]/20 to-[hsl(260,80%,60%)]/20 text-[hsl(221,80%,70%)]">
                <feat.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-white">{feat.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link to="/features">
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              View All Features <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[hsl(221,80%,56%)]/10 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-extrabold sm:text-4xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Ready to Transform Your Institution?
            </h2>
            <p className="mt-4 text-lg text-white/40">
              Join hundreds of schools already using Skoolvyn to digitize their operations.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-[hsl(221,80%,56%)] to-[hsl(260,80%,60%)] text-white border-0 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 px-8">
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
