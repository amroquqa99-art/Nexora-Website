import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emptySocial = { platform: "", url: "", icon: "", display_order: 0 };

const AdminSocialLinks = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);

  const { data: links = [] } = useQuery({
    queryKey: ["admin_social"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_links").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (l: any) => {
      const { id, created_at, ...rest } = l;
      if (id) {
        const { error } = await supabase.from("social_links").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("social_links").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_social"] }); setEditing(null); toast({ title: "✓" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_social"] }); toast({ title: "✓" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Social Links</h2>
        <button onClick={() => setEditing({ ...emptySocial })} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {editing && (
        <div className="glass-card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">{editing.id ? "Edit" : "Add"} Social Link</h3>
            <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Platform (e.g. Instagram)" value={editing.platform || ""} onChange={e => setEditing({ ...editing, platform: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <input placeholder="Icon (e.g. instagram, youtube)" value={editing.icon || ""} onChange={e => setEditing({ ...editing, icon: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <input placeholder="URL" value={editing.url || ""} onChange={e => setEditing({ ...editing, url: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm md:col-span-2" />
            <input type="number" placeholder="Order" value={editing.display_order ?? 0} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
          </div>
          <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saveMutation.isPending ? "..." : "Save"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {links.map((l) => (
          <div key={l.id} className="glass-card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">{l.platform}</p>
              <p className="text-xs text-muted-foreground truncate max-w-xs">{l.url}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...l })} className="p-2 hover:bg-muted rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
              <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(l.id); }} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
            </div>
          </div>
        ))}
        {links.length === 0 && <p className="text-muted-foreground text-center py-8">No social links yet</p>}
      </div>
    </div>
  );
};

export default AdminSocialLinks;
