import { useRef, useEffect, FormEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useAuthLogin } from "@/hooks/useAuthLogin";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminLogin = () => {
  const { 
    setEmail, 
    setPassword, 
    loading, handleLogin,
    navigate
  } = useAuthLogin({ role: "admin", redirectPath: "/admin" });
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  
  const formRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        navigate("/");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [navigate]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [navigate]);

  const onSubmit = (data: LoginFormValues) => {
    setEmail(data.email);
    setPassword(data.password);
    // use setTimeout to allow state changes to propagate before triggering login
    setTimeout(() => {
      handleLogin({ preventDefault: () => {} } as FormEvent);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div ref={formRef} className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center neon-glow" style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(40 90% 50%))" }}>
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">NEXORA Admin</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input
              type="email" {...register("email")}
              className={`w-full px-4 py-3 rounded-lg bg-muted border ${errors.email ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2`}
              placeholder="admin@nexora.team"
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <input
              type="password" {...register("password")}
              className={`w-full px-4 py-3 rounded-lg bg-muted border ${errors.password ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50"} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] neon-glow disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(40 90% 50%))" }}
          >
            {loading ? "..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
