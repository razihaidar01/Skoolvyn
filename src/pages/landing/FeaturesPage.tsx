import { motion } from 'framer-motion';
import { GraduationCap, Users, CreditCard, BarChart3, ShieldCheck, Bell, BookOpen, Calendar, ClipboardCheck, Bus, Building, BookMarked, Briefcase, UserCheck, FileText, Settings } from 'lucide-react';
import PublicLayout from '@/components/landing/PublicLayout';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const modules = [
  { icon: GraduationCap, title: 'Student Management', desc: 'Admissions, enrollment, profiles, promotions, and alumni tracking in one place.', color: 'from-blue-500/20 to-cyan-500/20' },
  { icon: Users, title: 'Staff & HR', desc: 'Manage staff profiles, designations, departments, payroll, and leave requests.', color: 'from-purple-500/20 to-pink-500/20' },
  { icon: CreditCard, title: 'Fee Management', desc: 'Create fee structures, collect payments online/offline, track defaulters, and generate receipts.', color: 'from-emerald-500/20 to-teal-500/20' },
  { icon: ClipboardCheck, title: 'Attendance', desc: 'Daily attendance marking with batch/subject-wise tracking and detailed reports.', color: 'from-amber-500/20 to-orange-500/20' },
  { icon: BookOpen, title: 'Examinations', desc: 'Schedule exams, enter marks, publish results, and generate student report cards.', color: 'from-red-500/20 to-rose-500/20' },
  { icon: Calendar, title: 'Timetable', desc: 'Auto-generate clash-free timetables for batches, subjects, and faculty.', color: 'from-indigo-500/20 to-violet-500/20' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Real-time dashboards covering fee collection, attendance trends, and exam performance.', color: 'from-sky-500/20 to-blue-500/20' },
  { icon: Bell, title: 'Announcements', desc: 'Send targeted announcements to students, parents, faculty, or the entire institution.', color: 'from-yellow-500/20 to-amber-500/20' },
  { icon: Building, title: 'Hostel', desc: 'Hostel allocation, room management, and warden assignments.', color: 'from-teal-500/20 to-green-500/20' },
  { icon: Bus, title: 'Transport', desc: 'Route management, vehicle tracking, and student-route assignments.', color: 'from-orange-500/20 to-red-500/20' },
  { icon: BookMarked, title: 'Library', desc: 'Book catalogue, issue/return tracking, fine management, and overdue alerts.', color: 'from-cyan-500/20 to-blue-500/20' },
  { icon: Briefcase, title: 'Placements', desc: 'Manage placement drives, company profiles, and student applications.', color: 'from-violet-500/20 to-purple-500/20' },
  { icon: UserCheck, title: 'Approval Workflow', desc: 'Multi-level approval for registrations, leave, and institutional onboarding.', color: 'from-pink-500/20 to-rose-500/20' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: '15+ granular roles — super admin, principal, HOD, faculty, accountant, and more.', color: 'from-green-500/20 to-emerald-500/20' },
  { icon: FileText, title: 'Assignments', desc: 'Create, distribute, and grade assignments with submission tracking.', color: 'from-blue-500/20 to-indigo-500/20' },
  { icon: Settings, title: 'Academic Setup', desc: 'Configure departments, programs, batches, subjects, and academic years.', color: 'from-gray-500/20 to-zinc-500/20' },
];

export default function FeaturesPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[hsl(221,80%,56%)]/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" className="text-center mb-20">
            <motion.h1 variants={fadeUp} custom={0} className="text-4xl font-extrabold sm:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Powerful Features for Every Institution
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">
              From student admissions to alumni tracking — Skoolvyn covers every aspect of institutional management.
            </motion.p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-1"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${mod.color}`}>
                  <mod.icon className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{mod.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{mod.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
