import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminServices = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    icon: "Briefcase",
    display_order: 0
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin_services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("display_order");
      if (error) throw error;
      return data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newService: typeof formData) => {
      const { error } = await supabase.from("services").insert(newService);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_services"] });
      queryClient.invalidateQueries({ queryKey: ["public_services"] }); // Cache for AboutSection
      setIsAdding(false);
      toast({ title: "Success", description: "Service added successfully" });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: typeof formData }) => {
      const { error } = await supabase.from("services").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_services"] });
      queryClient.invalidateQueries({ queryKey: ["public_services"] });
      setEditingId(null);
      toast({ title: "Success", description: "Service updated successfully" });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_services"] });
      queryClient.invalidateQueries({ queryKey: ["public_services"] });
      toast({ title: "Success", description: "Service deleted successfully" });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEdit = (service: any) => {
    setFormData({
      key: service.key,
      title_ar: service.title_ar,
      title_en: service.title_en,
      description_ar: service.description_ar,
      description_en: service.description_en,
      icon: service.icon,
      display_order: service.display_order
    });
    setEditingId(service.id);
    setIsAdding(false);
  };

  if (isLoading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-700 rounded"></div></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">Manage Services</h2>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({ key: "", title_ar: "", title_en: "", description_ar: "", description_en: "", icon: "Briefcase", display_order: 0 });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="glass p-6 rounded-xl space-y-4 border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Key (Internal identifier, must be unique)</label>
              <input type="text" required value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon Name (lucide-react)</label>
              <input type="text" required value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-primary font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title (Arabic)</label>
              <input type="text" required value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-right" dir="rtl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title (English)</label>
              <input type="text" required value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description (Arabic)</label>
              <textarea required rows={2} value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-right" dir="rtl" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description (English)</label>
              <textarea required rows={2} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input type="number" required value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={addMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Check className="w-4 h-4" /> Save
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map((service) => (
          <div key={service.id} className="glass p-5 rounded-xl border border-border/50 relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(service)} className="p-1.5 bg-background/80 hover:bg-primary/20 text-foreground hover:text-primary rounded-md backdrop-blur-sm transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => { if(window.confirm("Are you sure?")) deleteMutation.mutate(service.id) }} className="p-1.5 bg-background/80 hover:bg-destructive/20 text-foreground hover:text-destructive rounded-md backdrop-blur-sm transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-2">
              <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-mono rounded mb-3">
                {service.key}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-1">{lang === 'ar' ? service.title_ar : service.title_en}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{lang === 'ar' ? service.description_ar : service.description_en}</p>
          </div>
        ))}
        {(!services || services.length === 0) && !isLoading && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No services found. Click "Add Service" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServices;
