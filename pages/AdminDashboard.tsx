import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Briefcase, Users, UserPlus, MessageSquare, FileText, Share2, LogOut, Shield, BarChart3, FolderOpen, Receipt, FileSignature, Star, UsersRound } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminDashboardHome from "@/components/admin/AdminDashboardHome";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminJoinRequests from "@/components/admin/AdminJoinRequests";
import AdminCRM from "@/components/admin/AdminCRM";
import AdminContent from "@/components/admin/AdminContent";
import AdminServices from "@/components/admin/AdminServices";
import AdminSocialLinks from "@/components/admin/AdminSocialLinks";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminClientProjects from "@/components/admin/AdminClientProjects";
import AdminInvoices from "@/components/admin/AdminInvoices";
import AdminContracts from "@/components/admin/AdminContracts";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminClients from "@/components/admin/AdminClients";

type Tab = "overview" | "crm" | "clients" | "client_projects" | "invoices" | "contracts" | "reviews" | "projects" | "services" | "team" | "join" | "content" | "social" | "admin";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  const tabs = [
    { key: "overview" as Tab, label: t.admin.overview, icon: BarChart3 },
    { key: "crm" as Tab, label: t.admin.crm, icon: MessageSquare },
    { key: "clients" as Tab, label: "Clients", icon: UsersRound },
    { key: "client_projects" as Tab, label: "Client Projects", icon: FolderOpen },
    { key: "invoices" as Tab, label: "Invoices", icon: Receipt },
    { key: "contracts" as Tab, label: "Contracts", icon: FileSignature },
    { key: "reviews" as Tab, label: "Reviews", icon: Star },
    { key: "projects" as Tab, label: t.admin.projects, icon: Briefcase },
    { key: "services" as Tab, label: "Services", icon: Briefcase },
    { key: "team" as Tab, label: t.admin.teamMembers, icon: Users },
    { key: "join" as Tab, label: t.admin.joinRequests, icon: UserPlus },
    { key: "content" as Tab, label: t.admin.siteContent, icon: FileText },
    { key: "social" as Tab, label: t.admin.socialLinks, icon: Share2 },
    { key: "admin" as Tab, label: t.admin.adminManagement, icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 glass border-r border-border/30 flex flex-col min-h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 border-b border-border/30">
          <h1 className="text-xl font-bold gradient-text flex items-center gap-2"><LayoutDashboard className="w-5 h-5" /> NEXORA</h1>
          <p className="text-xs text-muted-foreground mt-1">{t.admin.dashboard}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border/30">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" />{t.admin.logout}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === "overview" && <AdminDashboardHome />}
        {activeTab === "crm" && <AdminCRM />}
        {activeTab === "clients" && <AdminClients />}
        {activeTab === "client_projects" && <AdminClientProjects />}
        {activeTab === "invoices" && <AdminInvoices />}
        {activeTab === "contracts" && <AdminContracts />}
        {activeTab === "reviews" && <AdminReviews />}
        {activeTab === "projects" && <AdminProjects />}
        {activeTab === "services" && <AdminServices />}
        {activeTab === "team" && <AdminTeam />}
        {activeTab === "join" && <AdminJoinRequests />}
        {activeTab === "content" && <AdminContent />}
        {activeTab === "social" && <AdminSocialLinks />}
        {activeTab === "admin" && <AdminUsers />}
      </main>
    </div>
  );
};

export default AdminDashboard;
