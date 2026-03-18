import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, MessageSquare, ChevronDown, User, Clock, CheckCircle, XCircle, Eye, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-500/10", icon: Clock },
  in_review: { label: "In Review", color: "text-blue-400 bg-blue-500/10", icon: Eye },
  approved: { label: "Approved", color: "text-green-400 bg-green-500/10", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-500/10", icon: XCircle },
  in_progress: { label: "In Progress", color: "text-purple-400 bg-purple-500/10", icon: Loader2 },
  completed: { label: "Completed", color: "text-emerald-400 bg-emerald-500/10", icon: ArrowRight },
};

const AdminCRM = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: requests = [] } = useQuery({
    queryKey: ["admin_crm"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["admin_team_for_assign"],
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("id, name_en, name_ar").order("name_en");
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { id: string; [key: string]: any }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from("contact_messages").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_crm"] }); toast({ title: "✓" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_crm"] }); toast({ title: "✓" }); },
  });

  const filtered = filterStatus === "all" ? requests : requests.filter(r => (r as any).status === filterStatus);

  const statusCounts = requests.reduce((acc: Record<string, number>, r) => {
    const s = (r as any).status || "pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Service Requests (CRM)</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <button onClick={() => setFilterStatus("all")} className={`glass-card p-3 text-center transition-all ${filterStatus === "all" ? "border-primary/50" : ""}`}>
          <p className="text-2xl font-bold text-foreground">{requests.length}</p>
          <p className="text-xs text-muted-foreground">All</p>
        </button>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilterStatus(key)} className={`glass-card p-3 text-center transition-all ${filterStatus === key ? "border-primary/50" : ""}`}>
            <p className={`text-2xl font-bold ${cfg.color.split(" ")[0]}`}>{statusCounts[key] || 0}</p>
            <p className="text-xs text-muted-foreground">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((r: any) => {
          const cfg = statusConfig[r.status] || statusConfig.pending;
          const StatusIcon = cfg.icon;
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="glass-card overflow-hidden">
              <div className="p-4 flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-foreground">{r.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.email}{r.company ? ` · ${r.company}` : ""}</p>
                  {r.service_type && <p className="text-xs text-primary mt-1">Service: {r.service_type}{r.budget ? ` · Budget: ${r.budget}` : ""}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-4">
                  <p className="text-sm text-foreground/80">{r.message}</p>
                  <p className="text-xs text-muted-foreground/60">{new Date(r.created_at).toLocaleString()}</p>

                  {/* Status buttons */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusConfig).map(([key, c]) => (
                      <button
                        key={key}
                        onClick={() => updateMutation.mutate({ id: r.id, status: key })}
                        className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${r.status === key ? c.color + " ring-1 ring-current" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Assign to team member */}
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <select
                      value={r.assigned_to || ""}
                      onChange={e => updateMutation.mutate({ id: r.id, assigned_to: e.target.value || null })}
                      className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name_en}</option>
                      ))}
                    </select>
                  </div>

                  {/* Internal notes */}
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground mt-2.5" />
                    <div className="flex-1">
                      <textarea
                        placeholder="Internal notes..."
                        value={notes[r.id] ?? r.internal_notes ?? ""}
                        onChange={e => setNotes({ ...notes, [r.id]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none"
                        rows={2}
                      />
                      {(notes[r.id] !== undefined && notes[r.id] !== (r.internal_notes ?? "")) && (
                        <button
                          onClick={() => { updateMutation.mutate({ id: r.id, internal_notes: notes[r.id] }); }}
                          className="mt-1 text-xs px-3 py-1 rounded bg-primary text-primary-foreground"
                        >
                          Save Notes
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(r.id); }} className="p-2 hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">No requests found</p>}
      </div>
    </div>
  );
};

export default AdminCRM;
