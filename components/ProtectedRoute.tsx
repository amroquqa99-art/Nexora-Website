import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  role?: "admin" | "team" | "client";
}

const ProtectedRoute = ({ children, role = "admin" }: ProtectedRouteProps) => {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const loginRoutes = {
        admin: "/admin/login",
        team: "/team/login",
        client: "/client/login"
      };

      const redirectPath = loginRoutes[role] || "/";

      if (!session) { 
        navigate(redirectPath); 
        return; 
      }

      if (role === "admin") {
        const { data } = await supabase.rpc("is_admin");
        if (!data) { navigate(redirectPath); return; }
      } else if (role === "team") {
        const { data } = await supabase.from("team_members").select("id").eq("user_id", session.user.id).single();
        if (!data) { navigate(redirectPath); return; }
      } else if (role === "client") {
        // Any authenticated user that reaches here is considered a client unless we have specific client-only verification.
        // Assuming session is enough for basic client protection.
      }

      setAuthorized(true);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
         const loginRoutes = { admin: "/admin/login", team: "/team/login", client: "/client/login" };
         navigate(loginRoutes[role] || "/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, role]);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
