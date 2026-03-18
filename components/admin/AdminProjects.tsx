import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Upload, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toDirectImageUrl } from "@/lib/gdrive";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Project = {
  id: string; title_ar: string; title_en: string; description_ar: string; description_en: string;
  category: string; thumbnail_url: string | null; video_url: string | null; display_order: number | null;
};

const emptyProject = { title_ar: "", title_en: "", description_ar: "", description_en: "", category: "other", thumbnail_url: "", video_url: "", display_order: 0 };

const SortableProjectItem = ({ project, onEdit, onDelete }: { project: any; onEdit: () => void; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="glass-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none">
          <GripVertical className="w-5 h-5 text-muted-foreground/60" />
        </button>
        {project.thumbnail_url && <img src={toDirectImageUrl(project.thumbnail_url)} alt="" className="w-16 h-12 rounded object-cover" />}
        <div>
          <p className="font-medium text-foreground text-sm">{project.title_ar} / {project.title_en}</p>
          <p className="text-xs text-muted-foreground">{project.category} · Order: {project.display_order}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 hover:bg-muted rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
        <button onClick={onDelete} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
      </div>
    </div>
  );
};

const AdminProjects = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Project> | null>(null);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } })
  );

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["admin_projects"],
    queryFn: async () => { const { data, error } = await supabase.from("projects").select("*").order("display_order"); if (error) throw error; return data; },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["admin_services"],
    queryFn: async () => { const { data, error } = await supabase.from("services").select("*").order("display_order"); if (error) throw error; return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async (p: Partial<Project>) => {
      const { id, ...rest } = p as any;
      delete rest.created_at; delete rest.updated_at;
      if (id) { const { error } = await supabase.from("projects").update(rest).eq("id", id); if (error) throw error; }
      else { const { error } = await supabase.from("projects").insert(rest); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_projects"] }); qc.invalidateQueries({ queryKey: ["projects"] }); setEditing(null); toast({ title: "✓" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("projects").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_projects"] }); qc.invalidateQueries({ queryKey: ["projects"] }); toast({ title: "✓" }); },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(projects, oldIndex, newIndex);

    // Update all display_order values
    const updates = reordered.map((p, i) => 
      supabase.from("projects").update({ display_order: i }).eq("id", p.id)
    );
    await Promise.all(updates);
    qc.invalidateQueries({ queryKey: ["admin_projects"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true);
    const path = `projects/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setUploading(false); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    setEditing((prev: any) => ({ ...prev, thumbnail_url: data.publicUrl }));
    setUploading(false);
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Projects</h2>
        <button onClick={() => setEditing(emptyProject)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="w-4 h-4" /> Add</button>
      </div>

      {editing && (
        <div className="glass-card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">{editing.id ? "Edit" : "Add"} Project</h3>
            <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Title AR" value={editing.title_ar || ""} onChange={e => setEditing({ ...editing, title_ar: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <input placeholder="Title EN" value={editing.title_en || ""} onChange={e => setEditing({ ...editing, title_en: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <textarea placeholder="Description AR" value={editing.description_ar || ""} onChange={e => setEditing({ ...editing, description_ar: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none" rows={2} />
            <textarea placeholder="Description EN" value={editing.description_en || ""} onChange={e => setEditing({ ...editing, description_en: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none" rows={2} />
            <select value={editing.category || "other"} onChange={e => setEditing({ ...editing, category: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              {services.map(s => (
                <option key={s.key} value={s.key}>{s.title_en}</option>
              ))}
              <option value="other">Other</option>
            </select>
            <input type="number" placeholder="Order" value={editing.display_order ?? 0} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors">
                <Upload className="w-4 h-4" /><span className="text-sm font-medium">{uploading ? "Uploading..." : "Upload Thumbnail"}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
              </label>
              <p className="text-xs text-muted-foreground mt-1">Or paste URL:</p>
              <input placeholder="Thumbnail URL" value={editing.thumbnail_url || ""} onChange={e => setEditing({ ...editing, thumbnail_url: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            </div>
            <input placeholder="Video URL (Google Drive or YouTube)" value={editing.video_url || ""} onChange={e => setEditing({ ...editing, video_url: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm md:col-span-2" />
          </div>
          {editing.thumbnail_url && (
            <div className="mt-3"><p className="text-xs text-muted-foreground mb-1">Preview:</p><img src={toDirectImageUrl(editing.thumbnail_url)} alt="preview" className="w-24 h-16 rounded object-cover" /></div>
          )}
          <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saveMutation.isPending ? "..." : "Save"}</button>
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-3">💡 اسحب العنصر لإعادة ترتيبه (اضغط مطولاً على الموبايل)</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {projects.map((p) => (
              <SortableProjectItem
                key={p.id}
                project={p}
                onEdit={() => setEditing({ ...p })}
                onDelete={() => { if (confirm("Delete?")) deleteMutation.mutate(p.id); }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default AdminProjects;
