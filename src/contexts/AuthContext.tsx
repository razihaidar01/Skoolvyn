import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getRedirectPath } from '@/lib/role-redirects';

interface Profile {
  id: string;
  institution_id: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  is_active: boolean;
  approval_status?: string | null;
  rejection_reason?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: string | null;
  institutionId: string | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null; redirectPath: string | null }>;
  signInWithOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null; redirectPath: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getApprovalRedirect(role: string | null, profile: any, institutionApprovalStatus?: string | null): string | null {
  if (role === 'super_admin') return null; // always allowed

  // For institution_admin, check institution approval
  if (role === 'institution_admin' && institutionApprovalStatus) {
    if (institutionApprovalStatus === 'pending') return '/pending-approval';
    if (institutionApprovalStatus === 'rejected') return '/account-rejected';
    if (institutionApprovalStatus === 'suspended') return '/account-suspended';
  }

  // For all other roles, check profile approval
  const profileStatus = profile?.approval_status;
  if (profileStatus === 'pending') return '/pending-approval';
  if (profileStatus === 'rejected') return '/account-rejected';
  if (profileStatus === 'suspended') return '/account-suspended';

  // Also check is_active
  if (profile && !profile.is_active) return '/account-suspended';

  return null;
}

async function fetchUserRoleAndProfile(userId: string) {
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { profile: null, role: null, institutionId: null, institutionApprovalStatus: null, error: null };
  }

  const { data: userRole } = await (supabase as any)
    .from('user_roles')
    .select('role_id, institution_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  let roleName: string | null = null;
  let institutionId: string | null = userRole?.institution_id || profile.institution_id;

  if (userRole?.role_id) {
    const { data: roleData } = await (supabase as any)
      .from('roles')
      .select('name')
      .eq('id', userRole.role_id)
      .single();
    roleName = roleData?.name || null;
  }

  // Check institution approval status for institution_admin
  let institutionApprovalStatus: string | null = null;
  if (roleName === 'institution_admin') {
    const { data: inst } = await (supabase as any)
      .from('institutions')
      .select('approval_status')
      .eq('registered_by', userId)
      .single();
    institutionApprovalStatus = inst?.approval_status || null;
  }

  if (roleName || institutionId) {
    await supabase.auth.updateUser({
      data: { role: roleName, institution_id: institutionId },
    });
  }

  return { profile, role: roleName, institutionId, institutionApprovalStatus, error: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const result = await fetchUserRoleAndProfile(session.user.id);
            setProfile(result.profile);
            setRole(result.role);
            setInstitutionId(result.institutionId);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setInstitutionId(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message, redirectPath: null };

    const result = await fetchUserRoleAndProfile(data.user.id);

    setProfile(result.profile);
    setRole(result.role);
    setInstitutionId(result.institutionId);

    // If no profile found, redirect to dashboard gracefully
    if (!result.profile) {
      return { error: null, redirectPath: '/dashboard' };
    }

    // Check approval status
    const approvalRedirect = getApprovalRedirect(result.role, result.profile, result.institutionApprovalStatus);
    if (approvalRedirect) {
      return { error: null, redirectPath: approvalRedirect };
    }

    // Check if account disabled (legacy check)
    if (!result.profile.is_active && result.role !== 'super_admin') {
      await supabase.auth.signOut();
      return { error: 'Account disabled. Please contact your administrator.', redirectPath: null };
    }

    return { error: null, redirectPath: result.role ? getRedirectPath(result.role) : '/dashboard' };
  };

  const signInWithOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { error: error.message };
    return { error: null };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) return { error: error.message, redirectPath: null };
    if (!data.user) return { error: 'Verification failed', redirectPath: null };

    const result = await fetchUserRoleAndProfile(data.user.id);

    setProfile(result.profile);
    setRole(result.role);
    setInstitutionId(result.institutionId);

    if (!result.profile) {
      return { error: null, redirectPath: '/dashboard' };
    }

    const approvalRedirect = getApprovalRedirect(result.role, result.profile, result.institutionApprovalStatus);
    if (approvalRedirect) {
      return { error: null, redirectPath: approvalRedirect };
    }

    return { error: null, redirectPath: result.role ? getRedirectPath(result.role) : '/dashboard' };
  };

  const resetPassword = async (email: string) => {
    const { data, error: fnError } = await supabase.functions.invoke('send-reset-email', {
      body: { email },
    });
    if (fnError) return { error: fnError.message };
    if (data?.error) return { error: data.error };
    return { error: null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setInstitutionId(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, role, institutionId, loading, signInWithEmail, signInWithOtp, verifyOtp, resetPassword, updatePassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
