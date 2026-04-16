import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getRedirectPath } from '@/lib/role-redirects';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (role) {
      // Redirect to correct portal based on role
      navigate(getRedirectPath(role), { replace: true });
    }
    // If role still null after 4 seconds, try reloading
    const timer = setTimeout(() => {
      window.location.reload();
    }, 4000);
    return () => clearTimeout(timer);
  }, [role, loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-foreground font-medium">Setting up your dashboard...</p>
        <p className="text-sm text-muted-foreground">
          {role ? `Redirecting to ${role.replace(/_/g, ' ')} portal...` : 'Loading your account...'}
        </p>
      </div>
    </div>
  );
}
