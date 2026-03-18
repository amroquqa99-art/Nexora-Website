import { useState } from "react";
import { Send } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const joinTeamSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().max(20).optional(),
  specialty: z.string().min(2, "Specialty is required").max(100),
  portfolio_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  message: z.string().max(1000).optional(),
});

type JoinTeamFormValues = z.infer<typeof joinTeamSchema>;

type Props = { open: boolean; onClose: () => void };

const JoinTeamForm = ({ open, onClose }: Props) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<JoinTeamFormValues>({
    resolver: zodResolver(joinTeamSchema),
  });

  const onSubmit = async (data: JoinTeamFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("join_requests").insert({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        specialty: data.specialty.trim(),
        portfolio_url: data.portfolio_url?.trim() || null,
        message: data.message?.trim() || null,
      });
      if (error) throw error;
      toast({ title: "✓", description: t.team.success });
      reset();
      onClose();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const errorClass = "border-destructive focus:ring-destructive/50";


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass-card border-border">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl">{t.team.joinTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t.team.joinDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t.team.name}</label>
            <input {...register("name")} placeholder={t.team.namePh} className={`${inputClass} ${errors.name ? errorClass : ""}`} maxLength={100} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t.team.email}</label>
              <input type="email" {...register("email")} placeholder={t.team.emailPh} className={`${inputClass} ${errors.email ? errorClass : ""}`} maxLength={255} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t.team.phone}</label>
              <input type="tel" {...register("phone")} placeholder={t.team.phonePh} className={`${inputClass} ${errors.phone ? errorClass : ""}`} maxLength={20} />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t.team.specialty}</label>
            <input {...register("specialty")} placeholder={t.team.specialtyPh} className={`${inputClass} ${errors.specialty ? errorClass : ""}`} maxLength={100} />
            {errors.specialty && <p className="text-xs text-destructive mt-1">{errors.specialty.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t.team.portfolioUrl}</label>
            <input type="url" {...register("portfolio_url")} placeholder={t.team.portfolioPh} className={`${inputClass} ${errors.portfolio_url ? errorClass : ""}`} maxLength={500} />
            {errors.portfolio_url && <p className="text-xs text-destructive mt-1">{errors.portfolio_url.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t.team.message}</label>
            <textarea rows={3} {...register("message")} placeholder={t.team.messagePh} className={`${inputClass} resize-none ${errors.message ? errorClass : ""}`} maxLength={1000} />
            {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] neon-glow disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(40 90% 50%))" }}
          >
            <Send className="w-4 h-4" />
            {t.team.submit}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinTeamForm;
