import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';

export default function PendingApprovalPage() {
  const { user, role, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const isInstitutionAdmin = role === 'institution_admin';
  const isStudent = role === 'student';

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!user) return;
      setChecking(true);

      // Re-check profile approval
      const { data: p } = await (supabase as any)
        .from('profiles')
        .select('approval_status')
        .eq('id', user.id)
        .single();

      if (p?.approval_status === 'approved') {
        // For institution admin, also check institution
        if (isInstitutionAdmin) {
          const { data: inst } = await (supabase as any)
            .from('institutions')
            .select('approval_status')
            .eq('registered_by', user.id)
            .single();
          if (inst?.approval_status === 'approved') {
            window.location.reload();
            return;
          }
        } else {
          window.location.reload();
          return;
        }
      }
      setChecking(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [user, isInstitutionAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const icon = isStudent ? '🎓' : isInstitutionAdmin ? '🏫' : '⏳';
  const title = isStudent
    ? 'Enrollment Pending'
    : isInstitutionAdmin
    ? 'Institution Under Review'
    : 'Account Pending Approval';
  const message = isStudent
    ? 'Your enrollment is under review by your institution. You\'ll be notified once approved.'
    : isInstitutionAdmin
    ? `Thank you for registering on Skoolvyn! Our team will verify your details and approve within 24 hours. You'll receive an email notification once approved.`
    : 'Your account is pending approval from your Institution Admin. You\'ll receive an email once approved. Contact your admin if urgent.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">SK</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Skoolvyn</span>
        </div>

        <div className="bg-card rounded-2xl border p-8 shadow-sm">
          <div className="text-5xl mb-4">{icon}</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">{title}</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">{message}</p>

          {checking && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking status...
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-6">
            Need help?{' '}
            <a href="mailto:support@skoolvyn.in" className="text-primary hover:underline">support@skoolvyn.in</a>
          </p>

          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
