import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, Trash2, X, Info, ShieldCheck, IndianRupee, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeIcon: Record<string, any> = {
  approval: ShieldCheck,
  fee: IndianRupee,
  alert: AlertCircle,
  info: Info,
  default: Info,
};
const typeColor: Record<string, string> = {
  approval: 'text-amber-500 bg-amber-50',
  fee: 'text-emerald-600 bg-emerald-50',
  alert: 'text-red-500 bg-red-50',
  info: 'text-blue-500 bg-blue-50',
  default: 'text-muted-foreground bg-muted',
};

export function NotificationsCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Real-time subscription
      const channel = (supabase as any)
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => fetchNotifications())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(30);
    setNotifications(data || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await (supabase as any).from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!ids.length) return;
    await (supabase as any).from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).in('id', ids);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id: string) => {
    await (supabase as any).from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = async () => {
    if (!notifications.length) return;
    await (supabase as any).from('notifications').delete().eq('user_id', user!.id);
    setNotifications([]);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && <Badge className="bg-red-500 text-white border-0 text-xs">{unread} new</Badge>}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} title="Clear all"
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : notifications.map(n => {
              const Icon = typeIcon[n.type] || typeIcon.default;
              const color = typeColor[n.type] || typeColor.default;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${!n.is_read ? 'bg-primary/3' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-tight ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {n.sent_at ? formatDistanceToNow(new Date(n.sent_at), { addSuffix: true }) : 'Just now'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} title="Mark read"
                        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteNotif(n.id)} title="Delete"
                      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t bg-muted/20 text-center">
              <p className="text-xs text-muted-foreground">{notifications.length} notification{notifications.length !== 1 ? 's' : ''} total</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}