import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const AUDIENCES = ['all', 'students', 'staff', 'parents', 'faculty'];

const priorityConfig: Record<string, { color: string; icon: any }> = {
  urgent: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
  high:   { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle },
  normal: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Info },
  low:    { color: 'bg-muted text-muted-foreground border-muted', icon: Info },
};

export function AnnouncementsModule() {
  const { institutionId, user } = useAuth();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    title: '',
    body: '',
    priority: 'normal',
    audience: ['all'],
    expires_at: '',
    is_published: false,
  });

  useEffect(() => {
    if (institutionId) fetchAnnouncements();
  }, [institutionId, filterPriority, filterStatus]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    let q = (supabase as any).from('announcements')
      .select('*')
      .eq('institution_id', institutionId!)
      .order('created_at', { ascending: false });
    if (filterPriority !== 'all') q = q.eq('priority', filterPriority);
    if (filterStatus === 'published') q = q.eq('is_published', true);
    if (filterStatus === 'draft') q = q.eq('is_published', false);
    const { data } = await q;
    setAnnouncements(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ title: '', body: '', priority: 'normal', audience: ['all'], expires_at: '', is_published: false });
    setShowDialog(true);
  };

  const openEdit = (ann: any) => {
    setEditId(ann.id);
    setForm({
      title: ann.title,
      body: ann.body,
      priority: ann.priority || 'normal',
      audience: ann.audience || ['all'],
      expires_at: ann.expires_at ? ann.expires_at.split('T')[0] : '',
      is_published: ann.is_published || false,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: 'Title and body required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const payload = {
        institution_id: institutionId,
        title: form.title.trim(),
        body: form.body.trim(),
        priority: form.priority,
        audience: form.audience,
        expires_at: form.expires_at || null,
        is_published: form.is_published,
        published_by: user?.id,
      };
      if (editId) {
        await (supabase as any).from('announcements').update(payload).eq('id', editId);
        toast({ title: '✅ Announcement updated!' });
      } else {
        await (supabase as any).from('announcements').insert(payload);
        toast({ title: '✅ Announcement created!' });
      }
      setShowDialog(false);
      fetchAnnouncements();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await (supabase as any).from('announcements').delete().eq('id', id);
    toast({ title: 'Deleted' });
    fetchAnnouncements();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await (supabase as any).from('announcements').update({ is_published: !current }).eq('id', id);
    toast({ title: !current ? '📢 Published!' : 'Moved to drafts' });
    fetchAnnouncements();
  };

  const toggleAudience = (a: string) => {
    setForm(f => ({
      ...f,
      audience: f.audience.includes(a)
        ? f.audience.filter(x => x !== a)
        : [...f.audience, a],
    }));
  };

  const published = announcements.filter(a => a.is_published).length;
  const drafts = announcements.filter(a => !a.is_published).length;
  const urgent = announcements.filter(a => a.priority === 'urgent' && a.is_published).length;

  // Wait for institutionId
  if (!institutionId) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Announcements</h2>
          <p className="text-sm text-muted-foreground">Post and manage announcements for your institution</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{published}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{drafts}</p>
            <p className="text-xs text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{urgent}</p>
            <p className="text-xs text-muted-foreground">Urgent</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : announcements.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium">No announcements yet</p>
            <Button className="mt-4" size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Create First Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const pc = priorityConfig[ann.priority || 'normal'];
            const PIcon = pc.icon;
            const isExpired = ann.expires_at && new Date(ann.expires_at) < new Date();
            return (
              <Card key={ann.id} className={`shadow-sm border-l-4 ${
                ann.priority === 'urgent' ? 'border-l-red-500' :
                ann.priority === 'high' ? 'border-l-amber-500' :
                ann.priority === 'normal' ? 'border-l-blue-500' : 'border-l-muted'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{ann.title}</h3>
                        <Badge className={`text-xs border capitalize ${pc.color}`}>
                          <PIcon className="w-3 h-3 mr-1" />{ann.priority || 'normal'}
                        </Badge>
                        {ann.is_published ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Published</Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground border-0 text-xs">Draft</Badge>
                        )}
                        {isExpired && (
                          <Badge className="bg-red-100 text-red-700 border-0 text-xs">Expired</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ann.body}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}</span>
                        {ann.audience && ann.audience.length > 0 && (
                          <span>→ {ann.audience.join(', ')}</span>
                        )}
                        {ann.expires_at && (
                          <span>Expires: {new Date(ann.expires_at).toLocaleDateString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => togglePublish(ann.id, ann.is_published)}>
                        {ann.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ann)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ann.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title" />
            </div>
            <div className="space-y-1.5">
              <Label>Body *</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Write your announcement here..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expires On</Label>
                <Input type="date" value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCES.map(a => (
                  <button key={a} onClick={() => toggleAudience(a)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                      form.audience.includes(a)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-muted hover:border-primary/50'
                    }`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="publish" checked={form.is_published}
                onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                className="rounded" />
              <Label htmlFor="publish" className="cursor-pointer">Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? 'Save Changes' : form.is_published ? 'Publish' : 'Save Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
