import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Film, Palette, Sparkles, Share2, Layers, Megaphone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useServices } from "@/hooks/useDynamicContent";
import { getIcon } from "@/lib/icons";

const AboutSection = () => {
  const { t, lang } = useLanguage();
  const { data: dbServices, isLoading } = useServices();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const staticServices = [
    { key: "montage", icon: Film, title: t.about.serviceMontage, desc: t.about.serviceMontageDesc, color: "from-primary to-neon-amber" },
    { key: "motion", icon: Sparkles, title: t.about.serviceMotion, desc: t.about.serviceMotionDesc, color: "from-neon-amber to-neon-gold" },
    { key: "design", icon: Palette, title: t.about.serviceDesign, desc: t.about.serviceDesignDesc, color: "from-neon-red to-primary" },
    { key: "social", icon: Share2, title: t.about.serviceSocial, desc: t.about.serviceSocialDesc, color: "from-neon-gold to-neon-amber" },
    { key: "branding", icon: Layers, title: t.about.serviceBranding, desc: t.about.serviceBrandingDesc, color: "from-primary to-neon-red" },
    { key: "campaign", icon: Megaphone, title: t.about.serviceCampaign, desc: t.about.serviceCampaignDesc, color: "from-neon-amber to-primary" },
    { key: "project_management", icon: Layers, title: lang === "ar" ? "إدارة المشاريع" : "Project Management", desc: lang === "ar" ? "إدارة وتخطيط مشاريعك الرقمية باحترافية" : "Professional planning and management of your digital projects", color: "from-purple-500 to-indigo-500" }
  ];

  const services = dbServices && dbServices.length > 0 
    ? dbServices.map(s => ({
        key: s.key,
        icon: getIcon(s.icon),
        title: lang === 'ar' ? s.title_ar : s.title_en,
        desc: lang === 'ar' ? s.description_ar : s.description_en,
        color: s.color || "from-primary to-neon-amber" // Fallback color
      }))
    : staticServices;

  const handleServiceClick = (serviceKey: string) => {
    // Append the service key to the URL parameters
    const url = new URL(window.location.href);
    url.searchParams.set("service", serviceKey);
    window.history.pushState({}, "", url);
    // Scroll to contact section
    const el = document.getElementById("contact");
    el?.scrollIntoView({ behavior: "smooth" });
    // Trigger a custom event so ContactSection can instantly pick up the change without reloading
    window.dispatchEvent(new Event("servicechanged"));
  };

  return (
    <section id="about" className="relative py-24 px-4" ref={ref}>
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-3">
            {t.about.title}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            {t.about.subtitle}
          </p>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t.about.description}
          </p>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-center text-foreground mb-10"
        >
          {t.about.services}
        </motion.h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i + 0.4 }}
              onClick={() => handleServiceClick(service.key)}
              className="glass-card p-6 group hover:border-primary/30 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">{service.title}</h4>
              <p className="text-sm text-muted-foreground">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
