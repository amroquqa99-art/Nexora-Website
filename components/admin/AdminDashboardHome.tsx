import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Users, UserPlus, MessageSquare, TrendingUp, Clock } from "lucide-react";

const AdminDashboardHome = () => {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [projects, team, joins, messages] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("team_members").select("id", { count: "exact", head: true }),
        supabase.from("join_requests").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      ]);
      return {
        projects: projects.count || 0,
        team: team.count || 0,
        joins: joins.count || 0,
        messages: messages.count || 0,
      };
    },
  });

  const { data: pendingRequests = [], isLoading: pendingLoading, isError: pendingError } = useQuery({
    queryKey: ["admin_pending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_messages")
        .select("id, name, email, service_type, created_at, status")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: recentJoins = [], isLoading: joinsLoading, isError: joinsError } = useQuery({
    queryKey: ["admin_recent_joins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("join_requests")
        .select("id, name, specialty, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const cards = [
    { label: "Projects", value: stats?.projects ?? 0, icon: Briefcase, color: "text-primary" },
    { label: "Team Members", value: stats?.team ?? 0, icon: Users, color: "text-neon-amber" },
    { label: "Join Requests", value: stats?.joins ?? 0, icon: UserPlus, color: "text-neon-gold" },
    { label: "Service Requests", value: stats?.messages ?? 0, icon: MessageSquare, color: "text-accent" },
  ];

  const isLoading = statsLoading || pendingLoading || joinsLoading;
  const isError = statsError || pendingError || joinsError;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-destructive">
        <p className="font-medium text-lg">Error loading dashboard data</p>
        <p className="text-sm text-muted-foreground mt-2">Please check your connection and try refreshing.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Dashboard Overview</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => (
              <div key={card.label} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                  <TrendingUp className="w-4 h-4 text-muted-foreground/40" />
                </div>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Service Requests */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Pending Service Requests
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.service_type || "General"} · {r.email}</p>
                </div>
                <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Pending</span>
              </div>
            ))}
            {pendingRequests.length === 0 && <p className="text-sm text-muted-foreground">No pending requests</p>}
          </div>
        </div>

        {/* Recent Join Requests */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Recent Join Requests
          </h3>
          <div className="space-y-3">
            {recentJoins.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.specialty}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "accepted" ? "text-green-400 bg-green-500/10" : r.status === "rejected" ? "text-red-400 bg-red-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>
                  {r.status}
                </span>
              </div>
            ))}
            {recentJoins.length === 0 && <p className="text-sm text-muted-foreground">No join requests</p>}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardHome;
