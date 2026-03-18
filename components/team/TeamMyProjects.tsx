import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { FolderOpen, ArrowLeft, Send, Upload, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const phaseLabels: Record<string, { ar: string; en: string; color: string }> = {
  request: { ar: "طلب", en: "Request", color: "text-yellow-400 bg-yellow-500/10" },
  planning: { ar: "تخطيط", en: "Planning", color: "text-blue-400 bg-blue-500/10" },
  production: { ar: "إنتاج", en: "Production", color: "text-purple-400 bg-purple-500/10" },
  review: { ar: "مراجعة", en: "Review", color: "text-orange-400 bg-orange-500/10" },
  delivery: { ar: "تسليم", en: "Delivery", color: "text-cyan-400 bg-cyan-500/10" },
  completed: { ar: "مكتمل", en: "Completed", color: "text-green-400 bg-green-500/10" },
};

const TeamMyProjects = ({ userId, teamMemberId }: { userId: string; teamMemberId: string }) => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "files">("messages");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: projects = [], isLoading, isError } = useQuery({
    queryKey: ["team_projects", teamMemberId],
    queryFn: async () => {
      const { data } = await supabase.from("client_projects").select("*").order("created_at", { ascending: false });
      // Filter projects where this team member is assigned
      return (data || []).filter((p: any) => {
        const team = p.assigned_team;
        if (!team) return false;
        const teamStr = JSON.stringify(team);
        return teamStr.includes(teamMemberId) || teamStr.includes(userId);
      });
    },
  });

  const project = projects.find((p: any) => p.id === selectedProject);

  const { data: messages = [] } = useQuery({
    queryKey: ["team_project_messages", selectedProject],
    enabled: !!selectedProject,
    queryFn: async () => {
      const { data } = await supabase.from("project_messages").select("*").eq("project_id", selectedProject!).order("created_at");
      return data || [];
    },
  });

  const { data: files = [] } = useQuery({
    queryKey: ["team_project_files", selectedProject],
    enabled: !!selectedProject,
    queryFn: async () => {
      const { data } = await supabase.from("project_files").select("*").eq("project_id", selectedProject!).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: clientProfile } = useQuery({
    queryKey: ["team_client_profile", project?.client_id],
    enabled: !!project?.client_id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", project!.client_id).single();
      return data;
    },
  });

  const { data: teamMember } = useQuery({
    queryKey: ["my_team_member", userId],
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("name_ar, name_en").eq("user_id", userId).single();
      return data;
    },
  });

  useEffect(() => {
    if (!selectedProject) return;
    const channel = supabase.channel(`team-msgs-${selectedProject}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${selectedProject}` }, () => {
        qc.invalidateQueries({ queryKey: ["team_project_messages", selectedProject] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedProject, qc]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMsg = useMutation({
    mutationFn: async () => {
      if (!msgText.trim() || !selectedProject) return;
      const senderName = lang === "ar" ? teamMember?.name_ar : teamMember?.name_en;
      const { error } = await supabase.from("project_messages").insert({
        project_id: selectedProject, sender_id: userId, sender_name: senderName || "Team Member",
        sender_role: "team", message: msgText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { setMsgText(""); qc.invalidateQueries({ queryKey: ["team_project_messages", selectedProject] }); },
  });

  const uploadFile = async (file: File) => {
    if (!selectedProject) return;
    const path = `${selectedProject}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("project-files").upload(path, file);
    if (uploadErr) { toast({ title: "Error", description: uploadErr.message, variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
    await supabase.from("project_files").insert({
      project_id: selectedProject, uploaded_by: userId, file_name: file.name,
      file_url: urlData.publicUrl, file_type: file.type, file_size: file.size,
    });
    qc.invalidateQueries({ queryKey: ["team_project_files", selectedProject] });
    toast({ title: "✓" });
  };

  if (selectedProject && project) {
    return (
      <div>
        <button onClick={() => setSelectedProject(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> {lang === "ar" ? "رجوع" : "Back"}
        </button>
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-1">{project.title}</h2>
          <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{lang === "ar" ? "العميل:" : "Client:"} <span className="text-foreground">{clientProfile?.full_name}</span></span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${phaseLabels[project.phase]?.color || ""}`}>
              {lang === "ar" ? phaseLabels[project.phase]?.ar : phaseLabels[project.phase]?.en}
            </span>
            <span className="text-muted-foreground">{project.progress}%</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(["messages", "files"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {t === "messages" ? (lang === "ar" ? "الرسائل" : "Messages") : (lang === "ar" ? "الملفات" : "Files")}
            </button>
          ))}
        </div>

        {activeTab === "messages" && (
          <div className="glass-card flex flex-col" style={{ height: "400px" }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-2 ${m.sender_id === userId ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    <p className="text-xs font-medium mb-1 opacity-70">{m.sender_name} · {m.sender_role}</p>
                    <p className="text-sm">{m.message}</p>
                    <p className="text-[10px] opacity-50 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-border/20 flex gap-2">
              <input value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg.mutate()}
                placeholder={lang === "ar" ? "اكتب رسالة..." : "Type a message..."} className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
              <button onClick={() => sendMsg.mutate()} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div className="glass-card p-4">
            <div className="mb-4">
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors">
                <Upload className="w-4 h-4" /><span className="text-sm font-medium">{lang === "ar" ? "رفع ملف" : "Upload File"}</span>
                <input type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              </label>
            </div>
            <div className="space-y-2">
              {files.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm text-foreground">{f.file_name}</p><p className="text-xs text-muted-foreground">{(f.file_size / 1024).toFixed(1)} KB</p></div></div>
                  <a href={f.file_url} target="_blank" className="p-2 hover:bg-muted rounded-lg"><Download className="w-4 h-4 text-primary" /></a>
                </div>
              ))}
              {files.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{lang === "ar" ? "لا توجد ملفات" : "No files yet"}</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

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
        <p className="text-muted-foreground text-center py-12">{lang === "ar" ? "لا توجد مشاريع مسندة إليك" : "No projects assigned to you"}</p>
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
    </div>
  );
};

export default TeamMyProjects;
