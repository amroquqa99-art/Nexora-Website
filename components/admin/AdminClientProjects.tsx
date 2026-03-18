import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Send, FolderOpen, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const phases = ["request", "planning", "production", "review", "delivery", "completed"];

const AdminClientProjects = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["admin_client_projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_projects").select("*, profiles(full_name, email)").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["admin_clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, client_type").order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (p: any) => {
      const { id, profiles, ...rest } = p;
      // Clean up fields
      delete rest.created_at;
      delete rest.updated_at;
      if (id) {
        const { error } = await supabase.from("client_projects").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        if (!rest.client_id) throw new Error("Please select a client");
        if (!rest.title?.trim()) throw new Error("Please enter a title");
        const { error } = await supabase.from("client_projects").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_client_projects"] }); setEditing(null); toast({ title: "✓ Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("client_projects").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_client_projects"] }); toast({ title: "✓ Deleted" }); },
  });

  // Messages for selected project
  const { data: messages = [] } = useQuery({
    queryKey: ["admin_project_messages", selectedProject],
    enabled: !!selectedProject,
    queryFn: async () => {
      const { data } = await supabase.from("project_messages").select("*").eq("project_id", selectedProject!).order("created_at");
      return data || [];
    },
  });

  useEffect(() => {
    if (!selectedProject) return;
    const channel = supabase.channel(`admin-msgs-${selectedProject}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${selectedProject}` }, () => {
        qc.invalidateQueries({ queryKey: ["admin_project_messages", selectedProject] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedProject, qc]);

  const sendAdminMsg = async () => {
    if (!msgText.trim() || !selectedProject) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("project_messages").insert({
      project_id: selectedProject, sender_id: session.user.id,
      sender_name: "Admin", sender_role: "admin", message: msgText.trim(),
    });
    setMsgText("");
    qc.invalidateQueries({ queryKey: ["admin_project_messages", selectedProject] });
  };

  // Project detail view
  if (selectedProject) {
    const proj = projects.find((p: any) => p.id === selectedProject);
    return (
      <div>
        <button onClick={() => setSelectedProject(null)} className="text-sm text-muted-foreground hover:text-foreground mb-4">← Back</button>
        <h2 className="text-xl font-bold text-foreground mb-4">{proj?.title} - Messages</h2>
        <div className="glass-card flex flex-col" style={{ height: "500px" }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m: any) => (
              <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-xl px-4 py-2 ${m.sender_role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <p className="text-xs font-medium mb-1 opacity-70">{m.sender_name} · {m.sender_role}</p>
                  <p className="text-sm">{m.message}</p>
                  <p className="text-[10px] opacity-50 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No messages yet</p>}
          </div>
          <div className="p-3 border-t border-border/20 flex gap-2">
            <input value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAdminMsg()}
              placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <button onClick={sendAdminMsg} className="p-2 rounded-lg bg-primary text-primary-foreground"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Client Projects</h2>
        <button onClick={() => setEditing({ title: "", description: "", client_id: "", phase: "request", progress: 0, service_type: "", budget: "", assigned_team: [] })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="w-4 h-4" /> New Project</button>
      </div>

      {editing && (
        <div className="glass-card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">{editing.id ? "Edit" : "New"} Project</h3>
            <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={editing.client_id || ""} onChange={e => setEditing({ ...editing, client_id: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              <option value="">Select Client</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
            </select>
            <input placeholder="Title" value={editing.title || ""} onChange={e => setEditing({ ...editing, title: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <textarea placeholder="Description" value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none md:col-span-2" rows={2} />
            <select value={editing.phase || "request"} onChange={e => setEditing({ ...editing, phase: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              {phases.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" placeholder="Progress %" value={editing.progress ?? 0} onChange={e => setEditing({ ...editing, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <input placeholder="Service Type" value={editing.service_type || ""} onChange={e => setEditing({ ...editing, service_type: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <input placeholder="Budget" value={editing.budget || ""} onChange={e => setEditing({ ...editing, budget: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
          </div>
          <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      )}

      {projects.length === 0 && <p className="text-muted-foreground text-center py-8">No client projects yet. Create one above.</p>}

      <div className="space-y-3">
        {projects.map((p: any) => (
          <div key={p.id} className="glass-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <p className="font-semibold text-foreground">{p.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p.phase}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.profiles?.full_name || "No client"} · {p.profiles?.email || ""}</p>
                <div className="flex items-center gap-2 mt-2"><div className="flex-1 bg-muted rounded-full h-1.5 max-w-xs"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${p.progress}%` }} /></div><span className="text-xs text-muted-foreground">{p.progress}%</span></div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setSelectedProject(p.id)} className="p-2 hover:bg-muted rounded-lg" title="Messages"><MessageSquare className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={() => setEditing({ ...p })} className="p-2 hover:bg-muted rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={() => { if (confirm("Delete this project?")) deleteMutation.mutate(p.id); }} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminClientProjects;
