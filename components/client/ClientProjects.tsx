import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { FolderOpen } from "lucide-react";
import ClientProjectDetail from "./ClientProjectDetail";

const phaseLabels: Record<string, { ar: string; en: string; color: string }> = {
  request: { ar: "طلب", en: "Request", color: "text-yellow-400 bg-yellow-500/10" },
  planning: { ar: "تخطيط", en: "Planning", color: "text-blue-400 bg-blue-500/10" },
  production: { ar: "إنتاج", en: "Production", color: "text-purple-400 bg-purple-500/10" },
  review: { ar: "مراجعة", en: "Review", color: "text-orange-400 bg-orange-500/10" },
  delivery: { ar: "تسليم", en: "Delivery", color: "text-cyan-400 bg-cyan-500/10" },
  completed: { ar: "مكتمل", en: "Completed", color: "text-green-400 bg-green-500/10" },
};

const ClientProjects = ({ userId }: { userId: string }) => {
  const { lang } = useLanguage();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: projects = [], isLoading, isError } = useQuery({
    queryKey: ["client_projects", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_projects").select("*").eq("client_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (selectedProject) return <ClientProjectDetail projectId={selectedProject} userId={userId} onBack={() => setSelectedProject(null)} />;

  if (isError) {
    return (
      <div className="text-center py-12 text-destructive">
        <p className="font-medium">{lang === "ar" ? "حدث خطأ أثناء جلب المشاريع" : "Error fetching projects."}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">{lang === "ar" ? "مشاريعي" : "My Projects"}</h2>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">{lang === "ar" ? "لا توجد مشاريع حالياً" : "No projects yet"}</p>
      ) : (
        <div className="grid gap-4">
        {projects.map((p: any) => {
          const phase = phaseLabels[p.phase] || phaseLabels.request;
          return (
            <button key={p.id} onClick={() => setSelectedProject(p.id)} className="glass-card p-5 text-start hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3"><FolderOpen className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">{p.title}</h3></div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${phase.color}`}>{lang === "ar" ? phase.ar : phase.en}</span>
              </div>
              {p.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${p.progress}%` }} /></div>
                <span className="text-xs text-muted-foreground">{p.progress}%</span>
              </div>
            </button>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default ClientProjects;
