import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function AccountRejectedPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Account Rejected</h1>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Your registration has been reviewed and was not approved.
          </p>
          {(profile as any)?.rejection_reason && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 border border-destructive/20 mb-4 text-left">
              <strong>Reason:</strong> {(profile as any).rejection_reason}
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-6">
            Contact your administrator or reach out to{' '}
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
