import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { ArrowLeft, Send, Upload, FileText, Star, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ContractSigning from "./ContractSigning";

const phases = ["request", "planning", "production", "review", "delivery", "completed"];
const phaseLabels: Record<string, { ar: string; en: string }> = {
  request: { ar: "طلب", en: "Request" }, planning: { ar: "تخطيط", en: "Planning" },
  production: { ar: "إنتاج", en: "Production" }, review: { ar: "مراجعة", en: "Review" },
  delivery: { ar: "تسليم", en: "Delivery" }, completed: { ar: "مكتمل", en: "Completed" },
};

const ClientProjectDetail = ({ projectId, userId, onBack }: { projectId: string; userId: string; onBack: () => void }) => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [msgText, setMsgText] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "files" | "contract" | "review">("messages");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: project } = useQuery({
    queryKey: ["client_project", projectId],
    queryFn: async () => { const { data } = await supabase.from("client_projects").select("*").eq("id", projectId).single(); return data; },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["project_messages", projectId],
    queryFn: async () => { const { data } = await supabase.from("project_messages").select("*").eq("project_id", projectId).order("created_at"); return data || []; },
  });

  const { data: files = [] } = useQuery({
    queryKey: ["project_files", projectId],
    queryFn: async () => { const { data } = await supabase.from("project_files").select("*").eq("project_id", projectId).order("created_at", { ascending: false }); return data || []; },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["project_contracts", projectId],
    queryFn: async () => { const { data } = await supabase.from("contracts").select("*").eq("project_id", projectId).eq("client_id", userId); return data || []; },
  });

  const { data: profile } = useQuery({
    queryKey: ["my_profile", userId],
    queryFn: async () => { const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).single(); return data; },
  });

  useEffect(() => {
    const channel = supabase.channel(`msgs-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${projectId}` }, () => {
        qc.invalidateQueries({ queryKey: ["project_messages", projectId] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, qc]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMsg = useMutation({
    mutationFn: async () => {
      if (!msgText.trim()) return;
      const { error } = await supabase.from("project_messages").insert({
        project_id: projectId, sender_id: userId, sender_name: profile?.full_name || "Client",
        sender_role: "client", message: msgText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { setMsgText(""); qc.invalidateQueries({ queryKey: ["project_messages", projectId] }); },
  });

  const uploadFile = async (file: File) => {
    const path = `${projectId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("project-files").upload(path, file);
    if (uploadErr) { toast({ title: "Error", description: uploadErr.message, variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
    await supabase.from("project_files").insert({
      project_id: projectId, uploaded_by: userId, file_name: file.name,
      file_url: urlData.publicUrl, file_type: file.type, file_size: file.size,
    });
    qc.invalidateQueries({ queryKey: ["project_files", projectId] });
    toast({ title: "✓" });
  };

  const currentPhaseIdx = phases.indexOf(project?.phase || "request");
  const isCompleted = project?.phase === "completed";

  const tabItems = ["messages", "files", "contract"] as const;
  const allTabs = isCompleted ? [...tabItems, "review" as const] : tabItems;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> {lang === "ar" ? "رجوع" : "Back"}
      </button>

      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">{project?.title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{project?.description}</p>
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
          {phases.map((ph, i) => (
            <div key={ph} className="flex items-center">
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${i <= currentPhaseIdx ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {lang === "ar" ? phaseLabels[ph].ar : phaseLabels[ph].en}
              </div>
              {i < phases.length - 1 && <div className={`w-6 h-0.5 ${i < currentPhaseIdx ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${project?.progress || 0}%` }} /></div>
          <span className="text-sm text-muted-foreground">{project?.progress || 0}%</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {allTabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {t === "messages" ? (lang === "ar" ? "الرسائل" : "Messages") : t === "files" ? (lang === "ar" ? "الملفات" : "Files") : t === "contract" ? (lang === "ar" ? "العقود" : "Contracts") : (lang === "ar" ? "التقييم" : "Review")}
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

      {activeTab === "contract" && (
        <div className="space-y-4">
          {contracts.map((c: any) => <ContractSigning key={c.id} contract={c} userId={userId} onSigned={() => qc.invalidateQueries({ queryKey: ["project_contracts", projectId] })} />)}
          {contracts.length === 0 && <p className="text-muted-foreground text-center py-8 glass-card p-6">{lang === "ar" ? "لا توجد عقود" : "No contracts yet"}</p>}
        </div>
      )}

      {activeTab === "review" && isCompleted && <ClientReviewForm projectId={projectId} userId={userId} />}
    </div>
  );
};

const ClientReviewForm = ({ projectId, userId }: { projectId: string; userId: string }) => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const { error } = await supabase.from("client_reviews").insert({ client_id: userId, project_id: projectId, rating, review_text: text });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: lang === "ar" ? "شكراً لتقييمك!" : "Thank you for your review!" });
    setSubmitted(true);
  };

  if (submitted) return <div className="glass-card p-8 text-center"><p className="text-primary text-lg font-semibold">{lang === "ar" ? "✓ تم إرسال تقييمك" : "✓ Review submitted"}</p></div>;

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-foreground mb-4">{lang === "ar" ? "قيّم تجربتك" : "Rate your experience"}</h3>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setRating(s)}><Star className={`w-8 h-8 ${rating >= s ? "text-primary fill-primary" : "text-muted-foreground"}`} /></button>)}
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={lang === "ar" ? "أخبرنا عن تجربتك..." : "Tell us about your experience..."}
        className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground text-sm resize-none mb-4" rows={3} />
      <button onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
        {lang === "ar" ? "إرسال التقييم" : "Submit Review"}
      </button>
    </div>
  );
};

export default ClientProjectDetail;
