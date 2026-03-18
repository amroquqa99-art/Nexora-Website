import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Star, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toDirectImageUrl } from "@/lib/gdrive";

const emptyMember = { name_ar: "", name_en: "", role_ar: "", role_en: "", image_url: "", display_order: 0, rating: 0, rating_notes: "", is_active: true, user_id: null as string | null };

const AdminTeam = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["admin_team"],
    queryFn: async () => { const { data, error } = await supabase.from("team_members").select("*").order("display_order"); if (error) throw error; return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async (m: any) => {
      const { id, created_at, updated_at, ...rest } = m;
      if (id) { const { error } = await supabase.from("team_members").update(rest).eq("id", id); if (error) throw error; }
      else { const { error } = await supabase.from("team_members").insert(rest); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_team"] }); qc.invalidateQueries({ queryKey: ["team_members"] }); setEditing(null); toast({ title: "✓" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("team_members").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_team"] }); qc.invalidateQueries({ queryKey: ["team_members"] }); toast({ title: "✓" }); },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const path = `team/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setUploading(false); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    setEditing((prev: any) => ({ ...prev, image_url: data.publicUrl }));
    setUploading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Team Members</h2>
        <button onClick={() => setEditing({ ...emptyMember })} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="w-4 h-4" /> Add</button>
      </div>

      {editing && (
        <div className="glass-card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">{editing.id ? "Edit" : "Add"} Member</h3>
            <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Name AR" value={editing.name_ar || ""} onChange={e => setEditing({ ...editing, name_ar: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <input placeholder="Name EN" value={editing.name_en || ""} onChange={e => setEditing({ ...editing, name_en: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <input placeholder="Role AR" value={editing.role_ar || ""} onChange={e => setEditing({ ...editing, role_ar: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <input placeholder="Role EN" value={editing.role_en || ""} onChange={e => setEditing({ ...editing, role_en: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            {/* Image upload */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">{uploading ? "Uploading..." : "Upload Image"}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
              </label>
              <p className="text-xs text-muted-foreground mt-1">Or paste URL:</p>
              <input placeholder="Image URL (optional)" value={editing.image_url || ""} onChange={e => setEditing({ ...editing, image_url: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            </div>
            <input type="number" placeholder="Order" value={editing.display_order ?? 0} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Rating:</label>
              <div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setEditing({ ...editing, rating: s })} className="p-0.5"><Star className={`w-5 h-5 ${(editing.rating || 0) >= s ? "text-primary fill-primary" : "text-muted-foreground"}`} /></button>)}</div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Active:</label>
              <input type="checkbox" checked={editing.is_active ?? true} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
            </div>
            <textarea placeholder="Rating Notes" value={editing.rating_notes || ""} onChange={e => setEditing({ ...editing, rating_notes: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none md:col-span-2" rows={2} />
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground block mb-1">Link User Account (User ID)</label>
              <input placeholder="User UUID (from auth)" value={editing.user_id || ""} onChange={e => setEditing({ ...editing, user_id: e.target.value || null })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
              <p className="text-xs text-muted-foreground mt-1">Link this team member to a user account so they can log in to the team dashboard</p>
            </div>
          </div>
          {editing.image_url && (
            <div className="mt-3"><p className="text-xs text-muted-foreground mb-1">Preview:</p><img src={toDirectImageUrl(editing.image_url)} alt="preview" className="w-20 h-20 rounded-full object-cover" /></div>
          )}
          <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saveMutation.isPending ? "..." : "Save"}</button>
        </div>
      )}

      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className={`glass-card p-4 flex items-center justify-between ${!m.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-4">
              {m.image_url && <img src={toDirectImageUrl(m.image_url)} alt="" className="w-12 h-12 rounded-full object-cover" />}
              <div>
                <p className="font-medium text-foreground text-sm">{m.name_ar} / {m.name_en}</p>
                <p className="text-xs text-muted-foreground">{m.role_ar} / {m.role_en}</p>
                {m.rating > 0 && <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${m.rating >= s ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />)}</div>}
                {(m as any).user_id && <span className="text-[10px] text-primary mt-0.5 block">● Linked Account</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...m })} className="p-2 hover:bg-muted rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
              <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(m.id); }} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTeam;
