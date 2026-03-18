import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Eye, Clock, CheckCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminJoinRequests = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: requests = [] } = useQuery({
    queryKey: ["admin_join_requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("join_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("join_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_join_requests"] }); toast({ title: "✓" }); },
  });

  const acceptAndAddToTeam = useMutation({
    mutationFn: async (request: any) => {
      // Update status to accepted
      const { error: updateError } = await supabase.from("join_requests").update({ status: "accepted" }).eq("id", request.id);
      if (updateError) throw updateError;
      
      // Add as team member
      const { error: insertError } = await supabase.from("team_members").insert({
        name_ar: request.name,
        name_en: request.name,
        role_ar: request.specialty,
        role_en: request.specialty,
        is_active: true,
        display_order: 0,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_join_requests"] });
      qc.invalidateQueries({ queryKey: ["admin_team"] });
      qc.invalidateQueries({ queryKey: ["team_members"] });
      toast({ title: "✓ تمت الموافقة وإضافته للفريق" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("join_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_join_requests"] }); toast({ title: "✓" }); },
  });

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400",
    reviewed: "text-blue-400",
    accepted: "text-green-400",
    rejected: "text-red-400",
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Join Requests</h2>
      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-foreground">{r.name}</p>
                <p className="text-sm text-muted-foreground">{r.email} · {r.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${statusColors[r.status] || ""}`}>{r.status}</span>
                <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(r.id); }} className="p-1.5 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4 text-destructive" /></button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 mb-3">
              <p><strong>Specialty:</strong> {r.specialty}</p>
              {r.portfolio_url && <p><strong>Portfolio:</strong> <a href={r.portfolio_url} target="_blank" className="text-primary hover:underline">{r.portfolio_url}</a></p>}
              {r.message && <p><strong>Message:</strong> {r.message}</p>}
              <p className="text-xs text-muted-foreground/60">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => updateStatus.mutate({ id: r.id, status: "reviewed" })} className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center gap-1"><Eye className="w-3 h-3" /> Reviewed</button>
              <button 
                onClick={() => acceptAndAddToTeam.mutate(r)} 
                disabled={r.status === "accepted"}
                className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center gap-1 disabled:opacity-50"
              >
                <UserPlus className="w-3 h-3" /> Accept & Add to Team
              </button>
              <button onClick={() => updateStatus.mutate({ id: r.id, status: "pending" })} className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</button>
            </div>
          </div>
        ))}
        {requests.length === 0 && <p className="text-muted-foreground text-center py-8">No join requests yet</p>}
      </div>
    </div>
  );
};

export default AdminJoinRequests;
