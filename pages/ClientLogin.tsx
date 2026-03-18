import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuthLogin } from "@/hooks/useAuthLogin";

const clientLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(3, "Full name is required").optional().or(z.literal("")),
  company: z.string().optional(),
  phone: z.string().optional(),
});

type ClientLoginFormValues = z.infer<typeof clientLoginSchema>;

const ClientLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { 
    setEmail, 
    setPassword, 
    loading, setLoading, handleLogin,
    lang, toast, navigate
  } = useAuthLogin({ role: "client", redirectPath: "/client" });

  const { register, handleSubmit, formState: { errors }, clearErrors } = useForm<ClientLoginFormValues>({
    resolver: zodResolver(clientLoginSchema),
  });

  const onSubmit = async (data: ClientLoginFormValues) => {
    setEmail(data.email);
    setPassword(data.password);
    
    if (!isSignUp) {
      setTimeout(() => {
        handleLogin({ preventDefault: () => {} } as FormEvent);
      }, 0);
      return;
    }
    
    // sign up flow
    if (!data.fullName) {
      toast({ title: lang === "ar" ? "الاسم مطلوب" : "Name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email, 
        password: data.password,
        options: { data: { full_name: data.fullName, company: data.company, phone: data.phone } },
      });
      if (error) throw error;
      toast({ title: lang === "ar" ? "تم إنشاء الحساب! تحقق من بريدك الإلكتروني للتفعيل" : "Account created! Check your email to verify" });
    } catch (err: any) {
      toast({ title: lang === "ar" ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    clearErrors();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) navigate("/"); }}>
      <div className="w-full max-w-md glass-card p-8" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">NEXORA</h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp 
              ? (lang === "ar" ? "إنشاء حساب عميل جديد" : "Create a new client account") 
              : (lang === "ar" ? "تسجيل دخول العميل" : "Client Login")}
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <input type="text" {...register("fullName")} placeholder={lang === "ar" ? "الاسم الكامل" : "Full Name"} 
                  className={`w-full px-4 py-3 rounded-lg bg-muted border ${errors.fullName ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2`} />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
              </div>
              <input type="text" {...register("company")} placeholder={lang === "ar" ? "اسم الشركة (اختياري)" : "Company (optional)"} 
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input type="tel" {...register("phone")} placeholder={lang === "ar" ? "رقم الهاتف (اختياري)" : "Phone (optional)"} 
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </>
          )}
          <div>
            <input type="email" {...register("email")} placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email"} 
              className={`w-full px-4 py-3 rounded-lg bg-muted border ${errors.email ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2`} />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <input type="password" {...register("password")} placeholder={lang === "ar" ? "كلمة المرور" : "Password"} 
              className={`w-full px-4 py-3 rounded-lg bg-muted border ${errors.password ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2`} />
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading ? "..." : isSignUp ? (lang === "ar" ? "إنشاء حساب" : "Sign Up") : (lang === "ar" ? "تسجيل الدخول" : "Sign In")}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">{lang === "ar" ? "العودة للرئيسية" : "Back to Home"}</Link>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
