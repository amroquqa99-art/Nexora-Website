import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminClients = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin_all_clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...rest }: any) => {
      const { error } = await supabase.from("profiles").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_all_clients"] }); toast({ title: "✓" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Clients</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{clients.filter((c: any) => c.client_type === "contract").length}</p>
          <p className="text-xs text-muted-foreground">Contract Clients</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{clients.filter((c: any) => c.client_type === "one_time").length}</p>
          <p className="text-xs text-muted-foreground">One-time Clients</p>
        </div>
      </div>
      <div className="space-y-3">
        {clients.map((c: any) => (
          <div key={c.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">{c.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{c.email} {c.company ? `· ${c.company}` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={c.client_type || "one_time"} onChange={e => updateMutation.mutate({ id: c.id, client_type: e.target.value })}
                className="text-xs px-2 py-1 rounded bg-muted border border-border text-foreground">
                <option value="one_time">One-time</option>
                <option value="contract">Contract</option>
              </select>
              <span className={`w-2 h-2 rounded-full ${c.is_active ? "bg-green-400" : "bg-red-400"}`} />
            </div>
          </div>
        ))}
        {clients.length === 0 && <p className="text-muted-foreground text-center py-8">No clients registered yet</p>}
      </div>
    </div>
  );
};

export default AdminClients;
