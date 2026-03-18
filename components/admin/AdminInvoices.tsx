import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminInvoices = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ["admin_invoices"],
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("*, profiles(full_name, email), client_projects(title)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["admin_clients_for_inv"],
    queryFn: async () => { const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name"); return data || []; },
  });

  const { data: clientProjects = [] } = useQuery({
    queryKey: ["admin_client_projects_for_inv"],
    queryFn: async () => { const { data } = await supabase.from("client_projects").select("id, title, client_id").order("title"); return data || []; },
  });

  const saveMutation = useMutation({
    mutationFn: async (inv: any) => {
      const { id, profiles, client_projects, ...rest } = inv;
      if (id) {
        const { error } = await supabase.from("invoices").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("invoices").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_invoices"] }); setEditing(null); toast({ title: "✓" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("invoices").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_invoices"] }); toast({ title: "✓" }); },
  });

  const statusColors: Record<string, string> = {
    draft: "text-muted-foreground bg-muted", sent: "text-blue-400 bg-blue-500/10",
    paid: "text-green-400 bg-green-500/10", overdue: "text-red-400 bg-red-500/10", cancelled: "text-muted-foreground bg-muted",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Invoices</h2>
        <button onClick={() => setEditing({ client_id: "", project_id: null, invoice_number: "", amount: 0, currency: "USD", status: "draft", due_date: "", notes: "", items: [] })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="w-4 h-4" /> New Invoice</button>
      </div>

      {editing && (
        <div className="glass-card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">{editing.id ? "Edit" : "New"} Invoice</h3>
            <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={editing.client_id || ""} onChange={e => setEditing({ ...editing, client_id: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              <option value="">Select Client</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <select value={editing.project_id || ""} onChange={e => setEditing({ ...editing, project_id: e.target.value || null })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              <option value="">No Project</option>
              {clientProjects.filter((cp: any) => !editing.client_id || cp.client_id === editing.client_id).map((cp: any) => <option key={cp.id} value={cp.id}>{cp.title}</option>)}
            </select>
            <input placeholder="Invoice Number" value={editing.invoice_number || ""} onChange={e => setEditing({ ...editing, invoice_number: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <input type="number" placeholder="Amount" value={editing.amount || ""} onChange={e => setEditing({ ...editing, amount: parseFloat(e.target.value) || 0 })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <select value={editing.currency || "USD"} onChange={e => setEditing({ ...editing, currency: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              <option value="USD">USD</option><option value="SAR">SAR</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
            </select>
            <select value={editing.status || "draft"} onChange={e => setEditing({ ...editing, status: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option>
            </select>
            <input type="date" value={editing.due_date?.split("T")[0] || ""} onChange={e => setEditing({ ...editing, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <textarea placeholder="Notes" value={editing.notes || ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm resize-none" rows={2} />
          </div>
          <button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending} className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Save</button>
        </div>
      )}

      <div className="space-y-3">
        {invoices.map((inv: any) => (
          <div key={inv.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">{inv.invoice_number || `INV-${inv.id.slice(0, 8)}`}</p>
                <p className="text-xs text-muted-foreground">{inv.profiles?.full_name} · {inv.currency} {Number(inv.amount).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[inv.status] || ""}`}>{inv.status}</span>
              <button onClick={() => setEditing({ ...inv })} className="p-2 hover:bg-muted rounded-lg"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
              <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(inv.id); }} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminInvoices;
