import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { LayoutDashboard, FolderOpen, FileText, Bell, LogOut } from "lucide-react";
import ClientProjects from "@/components/client/ClientProjects";
import ClientInvoices from "@/components/client/ClientInvoices";
import ClientNotifications from "@/components/client/ClientNotifications";

type Tab = "projects" | "invoices" | "notifications";

const ClientDashboard = () => {
  const [tab, setTab] = useState<Tab>("projects");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["client_profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId!).single();
      return data;
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread_notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId!).eq("is_read", false);
      return count || 0;
    },
  });

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  if (!userId) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const tabs = [
    { key: "projects" as Tab, label: lang === "ar" ? "مشاريعي" : "My Projects", icon: FolderOpen },
    { key: "invoices" as Tab, label: lang === "ar" ? "الفواتير" : "Invoices", icon: FileText },
    { key: "notifications" as Tab, label: lang === "ar" ? "الإشعارات" : "Notifications", icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-background flex" dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="w-64 glass border-r border-border/30 flex flex-col min-h-screen sticky top-0">
        <div className="p-6 border-b border-border/30">
          <h1 className="text-xl font-bold gradient-text flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> NEXORA</h1>
          <p className="text-xs text-muted-foreground mt-1">{profile?.full_name || "Client"}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              <t.icon className="w-4 h-4" />{t.label}
              {t.badge ? <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{t.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border/30">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" /> {lang === "ar" ? "تسجيل الخروج" : "Logout"}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {tab === "projects" && <ClientProjects userId={userId} />}
        {tab === "invoices" && <ClientInvoices userId={userId} />}
        {tab === "notifications" && <ClientNotifications userId={userId} />}
      </main>
    </div>
  );
};

export default ClientDashboard;
