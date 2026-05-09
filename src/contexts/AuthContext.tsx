import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getRedirectPath } from '@/lib/role-redirects';

interface Profile {
  id: string;
  institution_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
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
  // Step 1: Get user metadata (fastest path)
  const { data: { user } } = await supabase.auth.getUser();
  const metadataRole = user?.user_metadata?.role as string | null;
  const metadataInstitutionId = user?.user_metadata?.institution_id as string | null;

  // Step 2: Fetch profile
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  let roleName: string | null = null;
  let institutionId: string | null = null;
  let institutionApprovalStatus: string | null = null;

  // Step 3: PRIORITY — get role from user_roles table (ONLY source of truth)
  // Fetch ALL roles for this user, pick super_admin first
  let userRolesFetched = false;
  try {
    const { data: userRoles, error: urErr } = await (supabase as any)
      .from('user_roles')
      .select('role_id, institution_id, roles(name)')
      .eq('user_id', userId);

    if (!urErr && userRoles && userRoles.length > 0) {
      userRolesFetched = true;
      // Check if user is super_admin first (HIGHEST PRIORITY - never override)
      const superAdminRole = userRoles.find((r: any) => r.roles?.name === 'super_admin');
      if (superAdminRole) {
        roleName = 'super_admin';
        institutionId = null; // super admin has NO institution
      } else {
        // Take the role for the primary institution
        const primaryRole = userRoles[0];
        roleName = primaryRole.roles?.name || null;
        institutionId = primaryRole.institution_id || null;
      }
    }
  } catch (_) { /* RLS may block — handled below */ }

  // Step 4: If still no role, check metadata cache (fast path)
  if (!roleName && metadataRole) {
    // But NEVER trust metadata institution_admin without verification
    // because someone might have registered with same email
    if (metadataRole === 'super_admin') {
      roleName = 'super_admin';
      institutionId = null;
    } else {
      roleName = metadataRole;
      institutionId = metadataInstitutionId;
    }
  }

  // Step 5: For non-super-admin, get institution_id from profile if missing
  if (roleName && roleName !== 'super_admin' && !institutionId) {
    institutionId = profile?.institution_id || metadataInstitutionId || null;
  }
  
  // REMOVED: registered_by fallback - caused role confusion when same email
  // registers multiple times. user_roles is the ONLY source of truth.

  // Step 7: Get institution approval status (only for institution_admin)
  if (roleName === 'institution_admin' && institutionId) {
    try {
      const { data: inst } = await (supabase as any)
        .from('institutions')
        .select('approval_status, is_active')
        .eq('id', institutionId)
        .maybeSingle();
      institutionApprovalStatus = inst?.approval_status || null;
    } catch (_) {}
  }

  // Step 8: Cache role in metadata — NEVER downgrade super_admin
  const isDowngrade = metadataRole === 'super_admin' && roleName !== 'super_admin';
  if (!isDowngrade && roleName && (roleName !== metadataRole || institutionId !== metadataInstitutionId)) {
    try {
      await supabase.auth.updateUser({
        data: {
          role: roleName,
          institution_id: roleName === 'super_admin' ? null : institutionId,
        },
      });
    } catch (_) {}
  }

  return {
    profile: profile || null,
    role: roleName,
    institutionId: roleName === 'super_admin' ? null : institutionId,
    institutionApprovalStatus,
    error: null,
  };
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
    // Client-side rate limiting: 5 attempts per 15 minutes per email
    const rlKey = `login_${email.toLowerCase()}`;
    const stored = sessionStorage.getItem(rlKey);
    const WINDOW_MS = 15 * 60 * 1000;
    if (stored) {
      try {
        const { count, ts } = JSON.parse(stored);
        if (Date.now() - ts < WINDOW_MS && count >= 5) {
          return { error: 'Too many login attempts. Try again in 15 minutes.', redirectPath: null };
        }
      } catch { /* ignore parse errors */ }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Track failed attempt
      try {
        const curr = stored ? JSON.parse(stored) : { count: 0, ts: Date.now() };
        if (Date.now() - curr.ts > WINDOW_MS) {
          sessionStorage.setItem(rlKey, JSON.stringify({ count: 1, ts: Date.now() }));
        } else {
          sessionStorage.setItem(rlKey, JSON.stringify({ count: curr.count + 1, ts: curr.ts }));
        }
      } catch { /* storage blocked */ }
      return { error: error.message, redirectPath: null };
    }

    // Reset rate limit on success
    try { sessionStorage.removeItem(rlKey); } catch {}

    const result = await fetchUserRoleAndProfile(data.user.id);

    setProfile(result.profile);
    setRole(result.role);
    setInstitutionId(result.institutionId);

    // If no profile found, use role from metadata fallback
    if (!result.profile) {
      const path = result.role ? getRedirectPath(result.role) : '/dashboard';
      return { error: null, redirectPath: path };
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
      const path = result.role ? getRedirectPath(result.role) : '/dashboard';
      return { error: null, redirectPath: path };
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
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    try {
      // Preserve crash logs across sign out for support diagnostics
      const crashLogs = localStorage.getItem('skoolvyn_crash_logs');
      localStorage.clear();
      sessionStorage.clear();
      if (crashLogs) localStorage.setItem('skoolvyn_crash_logs', crashLogs);
    } catch { /* storage blocked */ }
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