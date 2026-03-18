import { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthLogin } from "@/hooks/useAuthLogin";

const teamLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type TeamLoginFormValues = z.infer<typeof teamLoginSchema>;

const TeamLogin = () => {
  const { 
    setEmail, 
    setPassword, 
    loading, handleLogin,
    lang 
  } = useAuthLogin({ role: "team", redirectPath: "/team" });

  const { register, handleSubmit, formState: { errors } } = useForm<TeamLoginFormValues>({
    resolver: zodResolver(teamLoginSchema),
  });


  const onSubmit = (data: TeamLoginFormValues) => {
    setEmail(data.email);
    setPassword(data.password);
    // use setTimeout to allow state changes to propagate before triggering login
    setTimeout(() => {
      handleLogin({ preventDefault: () => {} } as FormEvent);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-8" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">NEXORA</h1>
          <p className="text-muted-foreground text-sm">{lang === "ar" ? "تسجيل دخول أعضاء الفريق" : "Team Member Login"}</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {loading ? "..." : (lang === "ar" ? "تسجيل الدخول" : "Sign In")}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">{lang === "ar" ? "العودة للرئيسية" : "Back to Home"}</Link>
        </div>
      </div>
    </div>
  );
};

export default TeamLogin;
