import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// Map notification.type → preference key used in notification_preferences.event_prefs
const typeToPrefKey = (t: string): string | null => {
  if (t === "cognition") return "cognition_finished";
  if (t === "governance") return "policy_blocked";
  if (t === "escalation") return "insight_escalation";
  return null;
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eventPrefs, setEventPrefs] = useState<Record<string, { in_app: boolean; realtime: boolean }>>({});

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    const items = (data || []) as Notification[];
    setNotifications(items);
    setUnreadCount(items.filter(n => !n.is_read).length);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;
    // Load per-event preferences so realtime toasts respect the user's choices.
    (supabase.from("notification_preferences" as any) as any).select("event_prefs").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => { if (data?.event_prefs) setEventPrefs(data.event_prefs); });

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as Notification;
        const key = typeToPrefKey(n.type);
        const pref = key ? eventPrefs[key] : undefined;
        const inAppOn = !key || pref?.in_app !== false;
        const realtimeOn = !key || pref?.realtime !== false;
        if (inAppOn) {
          setNotifications(prev => [n, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
        if (realtimeOn) {
          toast(n.title, { description: n.message });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications, eventPrefs]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAsUnread = async (id: string) => {
    await supabase.from("notifications").update({ is_read: false }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
    setUnreadCount(prev => prev + 1);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, loading, markAsRead, markAsUnread, markAllAsRead, refetch: fetchNotifications };
};
