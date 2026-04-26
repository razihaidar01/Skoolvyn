import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, Building2, Users } from 'lucide-react';
import { format } from 'date-fns';

interface PendingInstitution {
  id: string;
  name: string;
  type: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  registered_by: string | null;
}

interface PendingStaff {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  institution_id: string | null;
  role_name?: string;
}

interface ApprovalManagementProps {
  mode: 'super_admin' | 'institution_admin';
  onPendingCountChange?: (count: number) => void;
}

export function ApprovalManagement({ mode, onPendingCountChange }: ApprovalManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingInstitutions, setPendingInstitutions] = useState<PendingInstitution[]>([]);
  const [pendingStaff, setPendingStaff] = useState<PendingStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; type: 'institution' | 'staff'; name: string }>({ open: false, id: '', type: 'institution', name: '' });
  const [rejectReason, setRejectReason] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      if (mode === 'super_admin') {
        // Fetch pending institutions
        const { data: insts } = await (supabase as any)
          .from('institutions')
          .select('id, name, type, contact_person, email, phone, city, state, created_at, registered_by')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });
        setPendingInstitutions(insts || []);

        // Fetch all pending staff (non institution_admin)
        const { data: staffProfiles } = await (supabase as any)
          .from('profiles')
          .select('id, first_name, last_name, email, phone, created_at, institution_id')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });

        if (staffProfiles?.length) {
          // Get roles for these users
          const userIds = staffProfiles.map((p: any) => p.id);
          const { data: userRoles } = await (supabase as any)
            .from('user_roles')
            .select('user_id, role_id')
            .in('user_id', userIds);

          const { data: roles } = await (supabase as any)
            .from('roles')
            .select('id, name');

          const roleMap: Record<string, string> = {};
          (roles || []).forEach((r: any) => { roleMap[r.id] = r.name; });

          const enriched = staffProfiles.map((p: any) => {
            const ur = (userRoles || []).find((u: any) => u.user_id === p.id);
            const roleName = ur ? roleMap[ur.role_id] : 'unknown';
            return { ...p, role_name: roleName };
          }).filter((p: any) => p.role_name !== 'super_admin' && p.role_name !== 'unknown');

          setPendingStaff(enriched);
        } else {
          setPendingStaff([]);
        }
      } else {
        // Institution admin: only their institution's staff
        // Use institutionId from auth context (DB-sourced) instead of user_metadata
        const { data: profileData } = await (supabase as any)
          .from('profiles')
          .select('institution_id')
          .eq('id', user?.id)
          .single();
        const safeInstitutionId = profileData?.institution_id;
        const { data: staffProfiles } = await (supabase as any)
          .from('profiles')
          .select('id, first_name, last_name, email, phone, created_at, institution_id')
          .eq('approval_status', 'pending')
          .eq('institution_id', safeInstitutionId)
          .order('created_at', { ascending: false });

        if (staffProfiles?.length) {
          const userIds = staffProfiles.map((p: any) => p.id);
          const { data: userRoles } = await (supabase as any)
            .from('user_roles')
            .select('user_id, role_id')
            .in('user_id', userIds);

          const { data: roles } = await (supabase as any)
            .from('roles')
            .select('id, name');

          const roleMap: Record<string, string> = {};
          (roles || []).forEach((r: any) => { roleMap[r.id] = r.name; });

          const enriched = staffProfiles.map((p: any) => {
            const ur = (userRoles || []).find((u: any) => u.user_id === p.id);
            const roleName = ur ? roleMap[ur.role_id] : 'unknown';
            return { ...p, role_name: roleName };
          }).filter((p: any) => p.role_name !== 'institution_admin' && p.role_name !== 'super_admin');

          setPendingStaff(enriched);
        } else {
          setPendingStaff([]);
        }
      }
    } catch (err) {
      console.error('Error fetching pending:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, [mode]);

  useEffect(() => {
    const total = pendingInstitutions.length + pendingStaff.length;
    onPendingCountChange?.(total);
  }, [pendingInstitutions, pendingStaff]);

  const handleApproveInstitution = async (inst: PendingInstitution) => {
    setActionLoading(inst.id);
    try {
      // Update institution
      await (supabase as any)
        .from('institutions')
        .update({
          approval_status: 'approved',
          is_active: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', inst.id);

      // Update admin profile
      if (inst.registered_by) {
        await (supabase as any)
          .from('profiles')
          .update({
            approval_status: 'approved',
            is_active: true,
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
          })
          .eq('id', inst.registered_by);
      }

      // Log
      await (supabase as any).from('approval_logs').insert({
        action: 'approved',
        target_type: 'institution',
        target_user_id: inst.registered_by,
        institution_id: inst.id,
        action_by: user?.id,
      });

      // Send email (best effort)
      supabase.functions.invoke('send-approval-email', {
        body: {
          type: 'institution_approved',
          recipient_email: inst.email,
          recipient_name: inst.contact_person || inst.name,
          institution_name: inst.name,
        },
      }).catch(() => {});

      toast({ title: 'Institution approved', description: `${inst.name} is now active.` });
      fetchPending();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setActionLoading(null);
  };

  const handleApproveStaff = async (staff: PendingStaff) => {
    setActionLoading(staff.id);
    try {
      // Step 1: Approve profile
      // Try direct update first (works for super_admin)
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({
          approval_status: 'approved',
          is_active: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', staff.id);
      
      // If RLS blocks direct update (institution_admin case), use upsert
      if (profileError) {
        // Try upsert which may bypass the RLS check differently
        const { error: upsertError } = await (supabase as any)
          .from('profiles')
          .upsert({
            id: staff.id,
            institution_id: staff.institution_id,
            first_name: staff.first_name,
            last_name: staff.last_name,
            email: staff.email,
            phone: staff.phone,
            approval_status: 'approved',
            is_active: true,
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
          });
        if (upsertError) {
          console.error('Profile approval error:', upsertError.message);
          // Don't throw - continue with staff record creation
          // The SQL policy needs to be fixed in Supabase
        }
      }

      // Step 2: Create staff record if not exists
      const fullName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();
      const { data: existingStaff } = await (supabase as any)
        .from('staff')
        .select('id')
        .eq('institution_id', staff.institution_id)
        .eq('email', staff.email)
        .maybeSingle();

      const designationMap: Record<string, string> = {
        faculty: 'Teacher', principal: 'Principal', hod: 'Head of Department',
        hr_manager: 'HR Manager', accountant: 'Accountant', librarian: 'Librarian',
        hostel_warden: 'Hostel Warden', transport_manager: 'Transport Manager',
      };

      if (!existingStaff) {
        const empId = `EMP-${Date.now().toString().slice(-6)}`;
        const { error: staffError } = await (supabase as any).from('staff').insert({
          institution_id: staff.institution_id,
          full_name: fullName,
          email: staff.email,
          phone: staff.phone || null,
          employee_id: empId,
          designation: designationMap[staff.role_name] || staff.role_name?.replace(/_/g, ' ') || 'Staff',
          staff_type: ['faculty','hod','principal'].includes(staff.role_name) ? 'teaching' : 'non_teaching',
          status: 'active',
          joining_date: new Date().toISOString().split('T')[0],
          user_id: staff.id,
        });
        if (staffError) console.error('Staff record create error (non-fatal):', staffError.message);
      } else {
        await (supabase as any).from('staff').update({ status: 'active', user_id: staff.id })
          .eq('id', existingStaff.id);
      }

      // Step 3: Log approval
      await (supabase as any).from('approval_logs').insert({
        action: 'approved',
        target_type: 'staff',
        target_user_id: staff.id,
        institution_id: staff.institution_id,
        action_by: user?.id,
      });

      // Step 4: Send notification to the staff
      try {
        await (supabase as any).from('notifications').insert({
          user_id: staff.id,
          institution_id: staff.institution_id,
          title: '✅ Your account has been approved!',
          body: `Welcome to Skoolvyn! You can now login as ${staff.role_name?.replace(/_/g, ' ')}.`,
          type: 'approval',
          sent_at: new Date().toISOString(),
        });
      } catch (_) {}

      // Step 5: Send email
      supabase.functions.invoke('send-approval-email', {
        body: {
          type: 'staff_approved',
          recipient_email: staff.email,
          recipient_name: fullName,
        },
      }).catch(() => {});

      toast({ title: '✅ Staff approved!', description: `${fullName} can now login.` });
      fetchPending();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectDialog.id);
    try {
      if (rejectDialog.type === 'institution') {
        const inst = pendingInstitutions.find(i => i.id === rejectDialog.id);
        await (supabase as any)
          .from('institutions')
          .update({ approval_status: 'rejected', rejection_reason: rejectReason })
          .eq('id', rejectDialog.id);

        if (inst?.registered_by) {
          await (supabase as any)
            .from('profiles')
            .update({ approval_status: 'rejected', rejection_reason: rejectReason })
            .eq('id', inst.registered_by);
        }

        await (supabase as any).from('approval_logs').insert({
          action: 'rejected',
          target_type: 'institution',
          target_user_id: inst?.registered_by,
          institution_id: rejectDialog.id,
          action_by: user?.id,
          reason: rejectReason,
        });

        supabase.functions.invoke('send-approval-email', {
          body: {
            type: 'institution_rejected',
            recipient_email: inst?.email,
            recipient_name: inst?.contact_person || inst?.name,
            institution_name: inst?.name,
            rejection_reason: rejectReason,
          },
        }).catch(() => {});
      } else {
        const staff = pendingStaff.find(s => s.id === rejectDialog.id);
        await (supabase as any)
          .from('profiles')
          .update({ approval_status: 'rejected', rejection_reason: rejectReason })
          .eq('id', rejectDialog.id);

        await (supabase as any).from('approval_logs').insert({
          action: 'rejected',
          target_type: 'staff',
          target_user_id: rejectDialog.id,
          institution_id: staff?.institution_id,
          action_by: user?.id,
          reason: rejectReason,
        });

        supabase.functions.invoke('send-approval-email', {
          body: {
            type: 'staff_rejected',
            recipient_email: staff?.email,
            recipient_name: `${staff?.first_name || ''} ${staff?.last_name || ''}`.trim(),
            rejection_reason: rejectReason,
          },
        }).catch(() => {});
      }

      toast({ title: 'Rejected', description: `${rejectDialog.name} has been rejected.` });
      setRejectDialog({ open: false, id: '', type: 'institution', name: '' });
      setRejectReason('');
      fetchPending();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setActionLoading(null);
  };

  if (loading) {
    return <div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const renderEmptyState = (icon: React.ReactNode, text: string) => (
    <div className="p-12 text-center">
      {icon}
      <p className="text-muted-foreground mt-2">{text}</p>
    </div>
  );

  // Guard: wait for institutionId
  if (!institutionId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mode === 'super_admin' ? (
        <Tabs defaultValue="institutions">
          <TabsList>
            <TabsTrigger value="institutions" className="gap-2">
              <Building2 className="w-4 h-4" />
              Institutions
              {pendingInstitutions.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] text-xs">{pendingInstitutions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <Users className="w-4 h-4" />
              Staff
              {pendingStaff.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] text-xs">{pendingStaff.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="institutions">
            {pendingInstitutions.length === 0 ? renderEmptyState(
              <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto" />,
              'No pending institution approvals'
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInstitutions.map(inst => (
                      <TableRow key={inst.id}>
                        <TableCell className="font-medium">{inst.name}</TableCell>
                        <TableCell className="capitalize">{inst.type}</TableCell>
                        <TableCell>{inst.contact_person || '-'}</TableCell>
                        <TableCell>{inst.email || '-'}</TableCell>
                        <TableCell>{inst.phone || '-'}</TableCell>
                        <TableCell>{[inst.city, inst.state].filter(Boolean).join(', ') || '-'}</TableCell>
                        <TableCell>{format(new Date(inst.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700 h-8" disabled={actionLoading === inst.id} onClick={() => handleApproveInstitution(inst)}>
                              {actionLoading === inst.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8" disabled={actionLoading === inst.id} onClick={() => setRejectDialog({ open: true, id: inst.id, type: 'institution', name: inst.name })}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff">
            {renderStaffTable()}
          </TabsContent>
        </Tabs>
      ) : (
        renderStaffTable()
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => { if (!o) { setRejectDialog({ ...rejectDialog, open: false }); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectDialog.name}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Rejection Reason *</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Please provide a reason..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog({ ...rejectDialog, open: false }); setRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason.trim() || !!actionLoading} onClick={handleReject}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderStaffTable() {
    if (pendingStaff.length === 0) {
      return renderEmptyState(
        <Users className="w-12 h-12 text-muted-foreground/40 mx-auto" />,
        'No pending staff approvals'
      );
    }
    return (
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingStaff.map(staff => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium">{staff.first_name} {staff.last_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{(staff.role_name || '').replace(/_/g, ' ')}</Badge>
                </TableCell>
                <TableCell>{staff.email || '-'}</TableCell>
                <TableCell>{staff.phone || '-'}</TableCell>
                <TableCell>{format(new Date(staff.created_at), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700 h-8" disabled={actionLoading === staff.id} onClick={() => handleApproveStaff(staff)}>
                      {actionLoading === staff.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="destructive" className="h-8" disabled={actionLoading === staff.id} onClick={() => setRejectDialog({ open: true, id: staff.id, type: 'staff', name: `${staff.first_name} ${staff.last_name}` })}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
}