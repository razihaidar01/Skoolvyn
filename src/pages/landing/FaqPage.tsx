import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PublicLayout from '@/components/landing/PublicLayout';

const faqs = [
  { q: 'What is Skoolvyn?', a: 'Skoolvyn is a comprehensive school and college management platform designed for Indian educational institutions. It covers student management, staff HR, fee collection, examinations, attendance, and 15+ other modules.' },
  { q: 'Is there a free plan?', a: 'Yes! Our Starter plan is completely free forever for institutions with up to 200 students. It includes core modules like student management, attendance, and basic reporting.' },
  { q: 'How secure is my data?', a: 'We use enterprise-grade security with row-level security (RLS) policies, encrypted connections, and role-based access control with 15+ granular roles. Your data is hosted on secure cloud infrastructure.' },
  { q: 'Can I collect fees online?', a: 'Yes, our Professional plan includes online fee collection with Razorpay integration, automated receipts, and defaulter tracking.' },
  { q: 'Does Skoolvyn support multiple branches?', a: 'Yes, our Enterprise plan supports multi-branch institutions with centralized dashboards and branch-level access control.' },
  { q: 'What kind of institutions can use Skoolvyn?', a: 'Skoolvyn is designed for schools (CBSE, ICSE, State Board), colleges, universities, coaching institutes, and any educational institution in India.' },
  { q: 'Is there a mobile app?', a: 'Yes, Skoolvyn has a mobile app for students, parents, and faculty with push notifications, attendance tracking, and fee payment capabilities.' },
  { q: 'How do I migrate from my existing system?', a: 'Our team provides free data migration support for Professional and Enterprise plans. We can import student, staff, and fee data from Excel sheets or other systems.' },
  { q: 'What support do you offer?', a: 'Starter plans get email support, Professional plans get priority support with faster response times, and Enterprise plans get 24/7 phone support with a dedicated account manager.' },
];

export default function FaqPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[hsl(221,80%,56%)]/15 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-extrabold sm:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-lg text-white/40">
              Everything you need to know about Skoolvyn.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-6 overflow-hidden data-[state=open]:border-white/20"
                >
                  <AccordionTrigger className="text-left text-white hover:no-underline py-5 text-base font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/50 pb-5 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
