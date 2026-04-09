import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import PublicLayout from '@/components/landing/PublicLayout';

export default function ContactPage() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: 'Message sent!', description: 'We\'ll get back to you within 24 hours.' });
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[hsl(221,80%,56%)]/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-extrabold sm:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">
              Have questions about Skoolvyn? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-2 max-w-5xl mx-auto">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Contact Information</h2>
                <div className="space-y-5">
                  {[
                    { icon: Mail, label: 'Email', value: 'hello@skoolvyn.com' },
                    { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
                    { icon: MapPin, label: 'Address', value: 'Bihar, India' },
                  ].map((info) => (
                    <div key={info.label} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(221,80%,56%)]/20 to-[hsl(260,80%,60%)]/20 text-[hsl(221,80%,70%)]">
                        <info.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm text-white/40">{info.label}</div>
                        <div className="text-white">{info.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold text-white mb-2">Enterprise Enquiries</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  For universities and multi-branch institutions, our enterprise team provides custom demos, pricing, and migration support.
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-white/60">Name</label>
                    <Input required placeholder="Your name" className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[hsl(221,80%,56%)]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-white/60">Email</label>
                    <Input required type="email" placeholder="you@example.com" className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[hsl(221,80%,56%)]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-white/60">Institution Name</label>
                  <Input placeholder="Your school or college" className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[hsl(221,80%,56%)]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-white/60">Message</label>
                  <Textarea required rows={5} placeholder="Tell us about your requirements..." className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[hsl(221,80%,56%)] resize-none" />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-[hsl(221,80%,56%)] to-[hsl(260,80%,60%)] text-white border-0 hover:opacity-90"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
