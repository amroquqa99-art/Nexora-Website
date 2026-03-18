import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Check, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminReviews = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: reviews = [] } = useQuery({
    queryKey: ["admin_reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("client_reviews").select("*, profiles(full_name, email), client_projects(title)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase.from("client_reviews").update({ is_approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_reviews"] }); toast({ title: "✓" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("client_reviews").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_reviews"] }); toast({ title: "✓" }); },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Client Reviews</h2>
      <div className="space-y-3">
        {reviews.map((r: any) => (
          <div key={r.id} className={`glass-card p-4 ${r.is_approved ? "border-green-500/20" : "border-yellow-500/20"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">{r.profiles?.full_name}</p>
                <p className="text-xs text-muted-foreground">{r.client_projects?.title || "General"}</p>
                <div className="flex gap-0.5 my-2">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${r.rating >= s ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />)}
                </div>
                <p className="text-sm text-foreground/80">{r.review_text}</p>
                <p className="text-xs text-muted-foreground/50 mt-2">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                {!r.is_approved ? (
                  <button onClick={() => updateMutation.mutate({ id: r.id, is_approved: true })} className="p-2 hover:bg-green-500/10 rounded-lg" title="Approve">
                    <Check className="w-4 h-4 text-green-400" />
                  </button>
                ) : (
                  <button onClick={() => updateMutation.mutate({ id: r.id, is_approved: false })} className="p-2 hover:bg-yellow-500/10 rounded-lg" title="Unapprove">
                    <X className="w-4 h-4 text-yellow-400" />
                  </button>
                )}
                <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(r.id); }} className="p-2 hover:bg-destructive/10 rounded-lg">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${r.is_approved ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>
              {r.is_approved ? "Published" : "Pending Approval"}
            </span>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-muted-foreground text-center py-8">No reviews yet</p>}
      </div>
    </div>
  );
};

export default AdminReviews;
