import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { User, Mail, Phone, Building } from "lucide-react";

const TeamMyClients = ({ userId, teamMemberId }: { userId: string; teamMemberId: string }) => {
  const { lang } = useLanguage();

  const { data: projects = [] } = useQuery({
    queryKey: ["team_projects_for_clients", teamMemberId],
    queryFn: async () => {
      const { data } = await supabase.from("client_projects").select("*").order("created_at", { ascending: false });
      return (data || []).filter((p: any) => {
        const teamStr = JSON.stringify(p.assigned_team || []);
        return teamStr.includes(teamMemberId) || teamStr.includes(userId);
      });
    },
  });

  const clientIds = [...new Set(projects.map((p: any) => p.client_id))];

  const { data: clients = [] } = useQuery({
    queryKey: ["team_clients", clientIds],
    enabled: clientIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").in("id", clientIds);
      return data || [];
    },
  });

  const getClientProjects = (clientId: string) => projects.filter((p: any) => p.client_id === clientId);

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">{lang === "ar" ? "عملائي" : "My Clients"}</h2>
      {clients.length === 0 && <p className="text-muted-foreground text-center py-12">{lang === "ar" ? "لا يوجد عملاء حالياً" : "No clients yet"}</p>}
      <div className="grid gap-4">
        {clients.map((c: any) => {
          const cProjects = getClientProjects(c.id);
          const activeProjects = cProjects.filter((p: any) => p.phase !== "completed");
          const completedProjects = cProjects.filter((p: any) => p.phase === "completed");
          return (
            <div key={c.id} className="glass-card p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{c.full_name}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    {c.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{c.email}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{c.phone}</span>}
                    {c.company && <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" />{c.company}</span>}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {lang === "ar" ? `${activeProjects.length} مشاريع نشطة` : `${activeProjects.length} active`}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">
                      {lang === "ar" ? `${completedProjects.length} مكتملة` : `${completedProjects.length} completed`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamMyClients;
