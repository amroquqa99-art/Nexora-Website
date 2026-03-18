import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Bell, Check } from "lucide-react";

const ClientNotifications = ({ userId }: { userId: string }) => {
  const { lang } = useLanguage();
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => { const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }); return data || []; },
  });

  useEffect(() => {
    const channel = supabase.channel(`notif-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => {
        qc.invalidateQueries({ queryKey: ["notifications", userId] });
        qc.invalidateQueries({ queryKey: ["unread_notifications", userId] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
    qc.invalidateQueries({ queryKey: ["unread_notifications", userId] });
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
    qc.invalidateQueries({ queryKey: ["unread_notifications", userId] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{lang === "ar" ? "الإشعارات" : "Notifications"}</h2>
        {notifications.some((n: any) => !n.is_read) && (
          <button onClick={markAllRead} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
            <Check className="w-3 h-3 inline mr-1" />{lang === "ar" ? "قراءة الكل" : "Mark all read"}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {notifications.map((n: any) => (
          <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
            className={`glass-card p-4 flex items-start gap-3 cursor-pointer transition-all ${!n.is_read ? "border-primary/30" : "opacity-60"}`}>
            <Bell className={`w-4 h-4 mt-0.5 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1"><p className="text-sm font-medium text-foreground">{n.title}</p><p className="text-xs text-muted-foreground">{n.message}</p><p className="text-[10px] text-muted-foreground/50 mt-1">{new Date(n.created_at).toLocaleString()}</p></div>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-muted-foreground text-center py-12">{lang === "ar" ? "لا توجد إشعارات" : "No notifications"}</p>}
      </div>
    </div>
  );
};

export default ClientNotifications;
