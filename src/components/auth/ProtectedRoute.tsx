import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, loading, role } = useAuth();
  const [waitTimeout, setWaitTimeout] = useState(false);

  // If role still null after 5 seconds, stop spinning and redirect
  useEffect(() => {
    if (!loading && session && allowedRoles && !role) {
      const t = setTimeout(() => setWaitTimeout(true), 5000);
      return () => clearTimeout(t);
    }
  }, [loading, session, role, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Role still loading — show spinner briefly then redirect to dashboard
  if (allowedRoles && !role) {
    if (waitTimeout) return <Navigate to="/dashboard" replace />;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}