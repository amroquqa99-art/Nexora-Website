import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, MailOpen, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminMessages = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [] } = useQuery({
    queryKey: ["admin_messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase.from("contact_messages").update({ is_read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_messages"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_messages"] }); toast({ title: "✓" }); },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Client Messages</h2>
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`glass-card p-5 ${!m.is_read ? "border-l-2 border-l-primary" : ""}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-foreground">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => markRead.mutate({ id: m.id, is_read: !m.is_read })}
                  className="p-1.5 hover:bg-muted rounded"
                  title={m.is_read ? "Mark unread" : "Mark read"}
                >
                  {m.is_read ? <MailOpen className="w-4 h-4 text-muted-foreground" /> : <Mail className="w-4 h-4 text-primary" />}
                </button>
                <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(m.id); }} className="p-1.5 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4 text-destructive" /></button>
              </div>
            </div>
            <p className="text-sm text-foreground/80 mb-2">{m.message}</p>
            <p className="text-xs text-muted-foreground/60">{new Date(m.created_at).toLocaleString()}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-muted-foreground text-center py-8">No messages yet</p>}
      </div>
    </div>
  );
};

export default AdminMessages;
