import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

type Role = "admin" | "team" | "client";

interface UseAuthLoginProps {
  role: Role;
  redirectPath: string;
}

export const useAuthLogin = ({ role, redirectPath }: UseAuthLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang, t } = useLanguage();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (role === "admin") {
        const { data: isAdmin } = await supabase.rpc("is_admin");
        if (!isAdmin) {
          await supabase.auth.signOut();
          throw new Error(lang === "ar" ? "أنت لست مشرفاً" : "You are not an admin");
        }
      } else if (role === "team") {
        const { data: teamMember } = await supabase
          .from("team_members")
          .select("id")
          .eq("user_id", authData.user.id)
          .single();

        if (!teamMember) {
          await supabase.auth.signOut();
          throw new Error(lang === "ar" ? "هذا الحساب ليس مرتبطاً بعضو فريق" : "This account is not linked to a team member");
        }
      }

      navigate(redirectPath);
    } catch (err: any) {
      toast({ 
        title: lang === "ar" ? "خطأ" : "Error", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    setLoading,
    handleLogin,
    lang,
    t,
    toast,
    navigate
  };
};
