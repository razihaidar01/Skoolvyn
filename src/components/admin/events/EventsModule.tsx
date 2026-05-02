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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Pencil, Trash2, Loader2, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EVENT_TYPES = ['academic', 'cultural', 'sports', 'holiday', 'exam', 'meeting', 'workshop', 'other'];

const typeColor: Record<string, string> = {
  academic:  'bg-blue-100 text-blue-700',
  cultural:  'bg-purple-100 text-purple-700',
  sports:    'bg-emerald-100 text-emerald-700',
  holiday:   'bg-red-100 text-red-700',
  exam:      'bg-amber-100 text-amber-700',
  meeting:   'bg-indigo-100 text-indigo-700',
  workshop:  'bg-teal-100 text-teal-700',
  other:     'bg-muted text-muted-foreground',
};

export function EventsModule() {
  const { institutionId, user } = useAuth();
  const { toast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'academic',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    is_holiday: false,
    audience: ['all'],
  });

  useEffect(() => {
    if (institutionId) fetchEvents();
  }, [institutionId, filterType]);

  const fetchEvents = async () => {
    setLoading(true);
    let q = (supabase as any).from('events')
      .select('*')
      .eq('institution_id', institutionId!)
      .order('start_date', { ascending: true });
    if (filterType !== 'all') q = q.eq('event_type', filterType);
    const { data } = await q;
    setEvents(data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({
      title: '', description: '', event_type: 'academic',
      start_date: '', end_date: '', start_time: '', end_time: '',
      venue: '', is_holiday: false, audience: ['all'],
    });
    setShowDialog(true);
  };

  const openEdit = (event: any) => {
    setEditId(event.id);
    setForm({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type || 'academic',
      start_date: event.start_date,
      end_date: event.end_date || '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      venue: event.venue || '',
      is_holiday: event.is_holiday || false,
      audience: event.audience || ['all'],
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.start_date) {
      toast({ title: 'Title and start date required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const payload = {
        institution_id: institutionId,
        title: form.title.trim(),
        description: form.description || null,
        event_type: form.event_type,
        start_date: form.start_date,
        end_date: form.end_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue || null,
        is_holiday: form.is_holiday,
        audience: form.audience,
        created_by: user?.id,
      };
      if (editId) {
        await (supabase as any).from('events').update(payload).eq('id', editId);
        toast({ title: '✅ Event updated!' });
      } else {
        await (supabase as any).from('events').insert(payload);
        toast({ title: '✅ Event created!' });
      }
      setShowDialog(false);
      fetchEvents();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await (supabase as any).from('events').delete().eq('id', id);
    toast({ title: 'Event deleted' });
    fetchEvents();
  };

  const toggleAudience = (a: string) => {
    setForm(f => ({
      ...f,
      audience: f.audience.includes(a)
        ? f.audience.filter(x => x !== a)
        : [...f.audience, a],
    }));
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.start_date >= today);
  const past = events.filter(e => e.start_date < today);
  const holidays = events.filter(e => e.is_holiday);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const isMultiDay = (e: any) => e.end_date && e.end_date !== e.start_date;

  const EventCard = ({ event }: { event: any }) => {
    const isPast = event.start_date < today;
    const tc = typeColor[event.event_type] || typeColor.other;
    return (
      <Card className={`shadow-sm border-l-4 ${
        event.is_holiday ? 'border-l-red-400' :
        event.event_type === 'exam' ? 'border-l-amber-400' :
        event.event_type === 'cultural' ? 'border-l-purple-400' :
        event.event_type === 'sports' ? 'border-l-emerald-400' :
        'border-l-primary'
      } ${isPast ? 'opacity-70' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 flex-1 min-w-0">
              {/* Date Badge */}
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-muted flex flex-col items-center justify-center">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {new Date(event.start_date).toLocaleDateString('en-IN', { month: 'short' })}
                </p>
                <p className="text-xl font-bold text-foreground leading-none">
                  {new Date(event.start_date).getDate()}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-sm">{event.title}</h3>
                  <Badge className={`text-xs border-0 capitalize ${tc}`}>{event.event_type}</Badge>
                  {event.is_holiday && <Badge className="bg-red-100 text-red-700 border-0 text-xs">Holiday</Badge>}
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {isMultiDay(event) ? `${formatDate(event.start_date)} – ${formatDate(event.end_date)}` : formatDate(event.start_date)}
                  </span>
                  {event.start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}
                    </span>
                  )}
                  {event.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.venue}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(event)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(event.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
          <h2 className="text-lg font-semibold">Events</h2>
          <p className="text-sm text-muted-foreground">Manage institution events and holidays</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{holidays.length}</p>
            <p className="text-xs text-muted-foreground">Holidays</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{past.length}</p>
            <p className="text-xs text-muted-foreground">Past</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="holidays">Holidays ({holidays.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : upcoming.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-16 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium">No upcoming events</p>
                <Button className="mt-4" size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add Event</Button>
              </CardContent>
            </Card>
          ) : upcoming.map(e => <EventCard key={e.id} event={e} />)}
        </TabsContent>

        <TabsContent value="past" className="space-y-3 mt-4">
          {past.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No past events</p>
          ) : past.map(e => <EventCard key={e.id} event={e} />)}
        </TabsContent>

        <TabsContent value="holidays" className="space-y-3 mt-4">
          {holidays.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No holidays added yet</p>
                <Button className="mt-4" size="sm" onClick={() => { openAdd(); setForm(f => ({ ...f, event_type: 'holiday', is_holiday: true })); }}>
                  <Plus className="w-4 h-4 mr-1" /> Add Holiday
                </Button>
              </CardContent>
            </Card>
          ) : holidays.map(e => <EventCard key={e.id} event={e} />)}
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Event details..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Event Type</Label>
                <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Venue</Label>
                <Input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="e.g. Main Hall" />
              </div>
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} min={form.start_date} />
              </div>
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <div className="flex flex-wrap gap-2">
                {['all', 'students', 'staff', 'parents', 'faculty'].map(a => (
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
              <input type="checkbox" id="holiday" checked={form.is_holiday}
                onChange={e => setForm(f => ({ ...f, is_holiday: e.target.checked }))} className="rounded" />
              <Label htmlFor="holiday" className="cursor-pointer text-red-600">Mark as Holiday (school off)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
