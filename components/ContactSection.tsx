import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Send, Instagram, Youtube, Mail, Linkedin, Globe, ExternalLink } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServices } from "@/hooks/useDynamicContent";

const iconMap: Record<string, any> = {
  instagram: Instagram,
  youtube: Youtube,
  mail: Mail,
  email: Mail,
  linkedin: Linkedin,
  upwork: Globe,
  fiverr: Globe,
  freelancer: Globe,
  mostaql: Globe,
  khamsat: Globe,
  behance: Globe,
  dribbble: Globe,
  default: ExternalLink,
};

const ContactSection = () => {
  const { t, lang } = useLanguage();
  const { data: dbServices } = useServices();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "", service_type: "", budget: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleServiceChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const serviceKey = urlParams.get("service");
      if (serviceKey) {
        setForm(prev => ({ ...prev, service_type: serviceKey }));
      }
    };
    
    // Initial check
    handleServiceChange();
    
    // Listen for custom event from AboutSection
    window.addEventListener("servicechanged", handleServiceChange);
    return () => window.removeEventListener("servicechanged", handleServiceChange);
  }, []);

  const { data: socialLinks = [] } = useQuery({
    queryKey: ["social_links"],
    queryFn: async () => {
      const { data } = await supabase.from("social_links").select("*").order("display_order");
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        company: form.company.trim(),
        service_type: form.service_type,
        budget: form.budget.trim(),
      });
      if (error) throw error;
      toast({ title: "✓", description: t.contact.success });
      setForm({ name: "", email: "", message: "", company: "", service_type: "", budget: "" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = dbServices && dbServices.length > 0
    ? dbServices.map(s => [s.key, lang === 'ar' ? s.title_ar : s.title_en])
    : [
        ...Object.entries(t.contact.serviceOptions),
        ["project_management", lang === "ar" ? "إدارة المشاريع" : "Project Management"]
      ];

  const getUrl = (social: { icon: string; url: string }) => {
    const iconLower = social.icon?.toLowerCase();
    if (iconLower === "mail" || iconLower === "email") {
      const email = social.url.replace("mailto:", "");
      return `mailto:${email}`;
    }
    return social.url;
  };

  const getTarget = (social: { icon: string; url: string }) => {
    const iconLower = social.icon?.toLowerCase();
    if (iconLower === "mail" || iconLower === "email") return "_self";
    return "_blank";
  };

  const defaultSocials = [
    { icon: "instagram", url: "#", platform: "Instagram" },
    { icon: "youtube", url: "#", platform: "YouTube" },
    { icon: "linkedin", url: "#", platform: "LinkedIn" },
    { icon: "upwork", url: "#", platform: "Upwork" },
    { icon: "mail", url: "mailto:contact@nexora.team", platform: "Email" },
  ];

  const socials = socialLinks.length > 0
    ? socialLinks.map(s => ({ icon: s.icon, url: s.url, platform: s.platform }))
    : defaultSocials;

  const inputClass = "w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <section id="contact" className="relative py-24 px-4" ref={ref}>
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-3">
            {t.contact.title}
          </h2>
          <p className="text-muted-foreground text-lg">{t.contact.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <motion.form
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.contact.name}</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t.contact.namePlaceholder} className={inputClass} maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.contact.email}</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={t.contact.emailPlaceholder} className={inputClass} maxLength={255} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.contact.company}</label>
                <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder={t.contact.companyPlaceholder} className={inputClass} maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.contact.serviceType}</label>
                <select value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })} className={inputClass}>
                  <option value="">{t.contact.servicePlaceholder}</option>
                  {serviceOptions.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.contact.budget}</label>
              <input type="text" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder={t.contact.budgetPlaceholder} className={inputClass} maxLength={50} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.contact.message}</label>
              <textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={t.contact.messagePlaceholder} className={inputClass + " resize-none"} maxLength={2000} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] neon-glow disabled:opacity-50" style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(40 90% 50%))" }}>
              <Send className="w-4 h-4" />
              {t.contact.send}
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center justify-center gap-4"
          >
            {socials.map((social, i) => {
              const iconKey = social.icon?.toLowerCase() || "default";
              const Icon = iconMap[iconKey] || iconMap.default;
              return (
                <motion.a
                  key={i}
                  href={getUrl(social)}
                  target={getTarget(social)}
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-4 glass-card px-8 py-4 w-full max-w-xs group hover:border-primary/30 transition-all duration-300"
                >
                  <Icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                  <span className="text-foreground font-medium">{social.platform}</span>
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
