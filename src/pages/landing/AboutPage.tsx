import { motion } from 'framer-motion';
import { Target, Eye, Zap, Heart } from 'lucide-react';
import PublicLayout from '@/components/landing/PublicLayout';

const values = [
  { icon: Target, title: 'Mission-Driven', desc: 'Democratizing school management technology for every institution in India, regardless of size or budget.' },
  { icon: Eye, title: 'Transparency', desc: 'Open pricing, clear communication, and no hidden surprises. What you see is what you get.' },
  { icon: Zap, title: 'Innovation', desc: 'Continuously evolving with AI-powered insights, automation, and modern UX to stay ahead of the curve.' },
  { icon: Heart, title: 'Community', desc: 'Built with feedback from educators, administrators, and parents who use Skoolvyn every day.' },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[hsl(260,80%,60%)]/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20 max-w-3xl mx-auto"
          >
            <h1 className="text-4xl font-extrabold sm:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              About Skoolvyn
            </h1>
            <p className="mt-6 text-lg text-white/50 leading-relaxed">
              Skoolvyn was born from a simple idea — that every school, college, and university in India deserves world-class digital infrastructure. We're building the operating system for modern Indian education.
            </p>
          </motion.div>

          {/* Story */}
          <div className="grid gap-16 lg:grid-cols-2 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
              <div className="space-y-4 text-white/50 leading-relaxed">
                <p>
                  Indian educational institutions manage thousands of students, complex fee structures, multiple examination systems, and diverse stakeholders — often using spreadsheets, registers, and disconnected software.
                </p>
                <p>
                  Skoolvyn was created to change that. We built a unified platform that brings together every aspect of institutional management — from admissions to alumni — in one elegant, powerful system.
                </p>
                <p>
                  Our platform is designed specifically for the Indian education ecosystem, with support for CBSE, ICSE, and state board structures, Indian currency and tax requirements, and the unique workflows of Indian institutions.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(221,80%,56%)]/10 to-[hsl(260,80%,60%)]/10 p-8 lg:p-12"
            >
              <div className="grid grid-cols-2 gap-8">
                {[
                  { num: '20+', label: 'Modules' },
                  { num: '15+', label: 'User Roles' },
                  { num: '100%', label: 'Made for India' },
                  { num: '24/7', label: 'Cloud Uptime' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-[hsl(221,80%,56%)] to-[hsl(260,80%,60%)] bg-clip-text text-transparent">
                      {s.num}
                    </div>
                    <div className="mt-1 text-sm text-white/40">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold text-white">Our Values</h2>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((val, i) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center"
              >
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(221,80%,56%)]/20 to-[hsl(260,80%,60%)]/20 text-[hsl(221,80%,70%)]">
                  <val.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{val.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
