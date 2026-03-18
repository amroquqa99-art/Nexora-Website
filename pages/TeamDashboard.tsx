import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { LayoutDashboard, FolderOpen, LogOut, Users } from "lucide-react";
import TeamMyProjects from "@/components/team/TeamMyProjects";
import TeamMyClients from "@/components/team/TeamMyClients";

type Tab = "projects" | "clients";

const TeamDashboard = () => {
  const [tab, setTab] = useState<Tab>("projects");
  const [userId, setUserId] = useState<string | null>(null);
  const [teamMemberId, setTeamMemberId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        const { data: tm } = await supabase.from("team_members").select("id").eq("user_id", session.user.id).single();
        if (tm) setTeamMemberId(tm.id);
      }
    });
  }, []);

  const { data: teamMember } = useQuery({
    queryKey: ["team_member_profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("*").eq("user_id", userId!).single();
      return data;
    },
  });

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  if (!userId || !teamMemberId) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const tabs = [
    { key: "projects" as Tab, label: lang === "ar" ? "مشاريعي" : "My Projects", icon: FolderOpen },
    { key: "clients" as Tab, label: lang === "ar" ? "عملائي" : "My Clients", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex" dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="w-64 glass border-r border-border/30 flex flex-col min-h-screen sticky top-0">
        <div className="p-6 border-b border-border/30">
          <h1 className="text-xl font-bold gradient-text flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> NEXORA</h1>
          <p className="text-xs text-muted-foreground mt-1">{lang === "ar" ? teamMember?.name_ar : teamMember?.name_en}</p>
          <p className="text-xs text-muted-foreground">{lang === "ar" ? teamMember?.role_ar : teamMember?.role_en}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              <t.icon className="w-4 h-4" />{t.label}
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
        {tab === "projects" && <TeamMyProjects userId={userId} teamMemberId={teamMemberId} />}
        {tab === "clients" && <TeamMyClients userId={userId} teamMemberId={teamMemberId} />}
      </main>
    </div>
  );
};

export default TeamDashboard;
