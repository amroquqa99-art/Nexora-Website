import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Play } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import VideoLightbox from "./VideoLightbox";
import { toDirectImageUrl } from "@/lib/gdrive";

const sampleProjects = [
  { id: "s1", title_ar: "إعلان ترويجي", title_en: "Promotional Ad", description_ar: "فيديو إعلاني احترافي لمنتج", description_en: "Professional product advertisement video", category: "montage", thumbnail_url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&h=400&fit=crop", video_url: "" },
  { id: "s2", title_ar: "موشن جرافيك تعليمي", title_en: "Educational Motion Graphics", description_ar: "فيديو موشن جرافيك تعليمي متحرك", description_en: "Animated educational motion graphics", category: "motion", thumbnail_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop", video_url: "" },
  { id: "s3", title_ar: "هوية بصرية", title_en: "Brand Identity", description_ar: "تصميم هوية بصرية كاملة", description_en: "Complete visual brand identity design", category: "design", thumbnail_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop", video_url: "" },
  { id: "s4", title_ar: "مونتاج سينمائي", title_en: "Cinematic Edit", description_ar: "مونتاج فيلم قصير بجودة سينمائية", description_en: "Short film with cinematic quality editing", category: "montage", thumbnail_url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop", video_url: "" },
  { id: "s5", title_ar: "انترو موشن", title_en: "Motion Intro", description_ar: "مقدمة موشن جرافيك لقناة يوتيوب", description_en: "Motion graphics intro for YouTube channel", category: "motion", thumbnail_url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop", video_url: "" },
  { id: "s6", title_ar: "بوستر إبداعي", title_en: "Creative Poster", description_ar: "تصميم بوستر إبداعي لفعالية", description_en: "Creative event poster design", category: "design", thumbnail_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", video_url: "" },
];

const PortfolioSection = () => {
  const { t, lang } = useLanguage();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { data: dbProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").order("display_order");
      return data || [];
    },
  });

  const projects = dbProjects.length > 0 ? dbProjects : sampleProjects;

  const filters = [
    { key: "all", label: t.portfolio.all },
    { key: "montage", label: t.portfolio.montage },
    { key: "motion", label: t.portfolio.motion },
    { key: "design", label: t.portfolio.design },
    { key: "other", label: t.portfolio.other },
  ];

  const filteredProjects = activeFilter === "all" ? projects : projects.filter(p => p.category === activeFilter);

  return (
    <section id="portfolio" className="relative py-24 px-4" ref={ref}>
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-3">{t.portfolio.title}</h2>
          <p className="text-muted-foreground text-lg">{t.portfolio.subtitle}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-wrap justify-center gap-3 mb-12">
          {filters.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeFilter === f.key ? "bg-gradient-to-r from-primary to-accent text-primary-foreground neon-glow" : "glass text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} lang={lang} isInView={isInView} onSelect={() => setSelectedProject(project)} />
          ))}
        </div>
      </div>

      {selectedProject && (
        <VideoLightbox
          project={{
            title: lang === "ar" ? selectedProject.title_ar : selectedProject.title_en,
            description: lang === "ar" ? selectedProject.description_ar : selectedProject.description_en,
            thumbnail: toDirectImageUrl(selectedProject.thumbnail_url),
            videoUrl: selectedProject.video_url || undefined,
          }}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
};

const ProjectCard = ({ project, index, lang, isInView, onSelect }: { project: any; index: number; lang: string; isInView: boolean; onSelect: () => void }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientX - rect.left) / rect.width - 0.5) * 15, y: ((e.clientY - rect.top) / rect.height - 0.5) * -15 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 * index }}
      onMouseMove={handleMouseMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })} onClick={onSelect}
      className="glass-card overflow-hidden cursor-pointer group"
      style={{ transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`, transition: "transform 0.15s ease-out" }}
    >
      <div className="relative overflow-hidden aspect-video">
        <img src={toDirectImageUrl(project.thumbnail_url)} alt={lang === "ar" ? project.title_ar : project.title_en} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Play className="w-8 h-8 text-foreground" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1">{lang === "ar" ? project.title_ar : project.title_en}</h3>
        <p className="text-sm text-muted-foreground">{lang === "ar" ? project.description_ar : project.description_en}</p>
      </div>
    </motion.div>
  );
};

export default PortfolioSection;
