import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const AdminContent = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ key: "", value_ar: "", value_en: "" });

  const { data: content = [] } = useQuery({
    queryKey: ["admin_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

  // Initialize edits from content when content loads
  const [edits, setEdits] = useState<Record<string, { value_ar: string; value_en: string }>>({});
  
  useEffect(() => {
    if (content.length > 0) {
      const initial: Record<string, { value_ar: string; value_en: string }> = {};
      content.forEach(c => {
        if (!edits[c.id]) {
          initial[c.id] = { value_ar: c.value_ar, value_en: c.value_en };
        }
      });
      if (Object.keys(initial).length > 0) {
        setEdits(prev => ({ ...initial, ...prev }));
      }
    }
  }, [content]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, value_ar, value_en }: { id: string; value_ar: string; value_en: string }) => {
      const { error } = await supabase.from("site_content").update({ value_ar, value_en }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_content"] }); toast({ title: "✓" }); },
  });

  const addMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const { error } = await supabase.from("site_content").insert(item);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_content"] }); setAdding(false); setNewItem({ key: "", value_ar: "", value_en: "" }); toast({ title: "✓" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_content"] }); toast({ title: "✓" }); },
  });

  const teamVisible = content.find(c => c.key === "team_section_visible");
  const isTeamVisible = teamVisible ? teamVisible.value_en === "true" : true;

  const toggleTeamSection = () => {
    if (!teamVisible) return;
    const newVal = isTeamVisible ? "false" : "true";
    updateMutation.mutate({ id: teamVisible.id, value_ar: newVal, value_en: newVal });
  };

  return (
    <div>
      <div className="glass-card p-4 mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">إظهار / إخفاء صفحة الفريق</h3>
          <p className="text-xs text-muted-foreground">التحكم بظهور قسم الفريق في الصفحة الرئيسية والقائمة</p>
        </div>
        <Switch checked={isTeamVisible} onCheckedChange={toggleTeamSection} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Site Content</h2>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {adding && (
        <div className="glass-card p-4 mb-4 space-y-3">
          <input placeholder="Key (e.g. hero_title)" value={newItem.key} onChange={e => setNewItem({ ...newItem, key: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
          <textarea placeholder="Arabic value" value={newItem.value_ar} onChange={e => setNewItem({ ...newItem, value_ar: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none" rows={2} />
          <textarea placeholder="English value" value={newItem.value_en} onChange={e => setNewItem({ ...newItem, value_en: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none" rows={2} />
          <div className="flex gap-2">
            <button onClick={() => addMutation.mutate(newItem)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Save</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {content.map((c) => {
          const edit = edits[c.id] || { value_ar: c.value_ar, value_en: c.value_en };
          const changed = edit.value_ar !== c.value_ar || edit.value_en !== c.value_en;
          return (
            <div key={c.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="text-xs bg-muted px-2 py-1 rounded text-primary">{c.key}</code>
                <div className="flex gap-2">
                  {changed && (
                    <button onClick={() => updateMutation.mutate({ id: c.id, ...edit })} className="p-1.5 hover:bg-primary/10 rounded"><Save className="w-4 h-4 text-primary" /></button>
                  )}
                  <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(c.id); }} className="p-1.5 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">AR</label>
                  <textarea value={edit.value_ar} onChange={e => setEdits({ ...edits, [c.id]: { ...edit, value_ar: e.target.value } })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none" rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">EN</label>
                  <textarea value={edit.value_en} onChange={e => setEdits({ ...edits, [c.id]: { ...edit, value_en: e.target.value } })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none" rows={2} />
                </div>
              </div>
            </div>
          );
        })}
        {content.length === 0 && <p className="text-muted-foreground text-center py-8">No content entries yet</p>}
      </div>
    </div>
  );
};

export default AdminContent;
