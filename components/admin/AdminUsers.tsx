import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Clock, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  moderator: "Moderator",
  user: "User",
  project_manager: "Project Manager",
  creative_lead: "Creative Lead",
  editor: "Editor",
  designer: "Designer",
  social_media_manager: "Social Media Manager",
};

const AdminUsers = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [creating, setCreating] = useState(false);

  const { data: roles = [] } = useQuery({
    queryKey: ["admin_user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["admin_activity_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const handleCreateAdmin = async () => {
    if (!newEmail || !newPassword) return;
    setCreating(true);
    try {
      // Sign up the new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Failed to create user");

      // Assign role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: signUpData.user.id,
        role: newRole as any,
      });
      if (roleError) throw roleError;

      qc.invalidateQueries({ queryKey: ["admin_user_roles"] });
      toast({ title: "✓ تم إنشاء الحساب بنجاح" });
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* User Roles */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admin & Role Management
          </h2>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <UserPlus className="w-4 h-4" /> Create Admin
          </button>
        </div>

        {showCreate && (
          <div className="glass-card p-6 mb-6 space-y-4">
            <h3 className="font-semibold text-foreground">Create New Admin Account</h3>
            <input
              type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
            />
            <input
              type="password" placeholder="Password (min 6 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
            />
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={handleCreateAdmin} disabled={creating} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {creating ? "..." : "Create"}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-6 py-2 rounded-lg bg-muted text-foreground text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {roles.map((r: any) => (
            <div key={r.id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground font-mono">{r.user_id}</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {roleLabels[r.role] || r.role}
              </span>
            </div>
          ))}
          {roles.length === 0 && <p className="text-muted-foreground text-center py-4">No roles assigned yet</p>}
        </div>
      </div>

      {/* Activity Logs */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Activity Logs
        </h3>
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="glass-card p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{log.action}</p>
                {log.details && <p className="text-xs text-muted-foreground">{log.details}</p>}
              </div>
              <p className="text-xs text-muted-foreground/60">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
          {logs.length === 0 && <p className="text-muted-foreground text-center py-4">No activity logs yet</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
