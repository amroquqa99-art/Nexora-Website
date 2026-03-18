import ParticlesBackground from "@/components/ParticlesBackground";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PortfolioSection from "@/components/PortfolioSection";
import AboutSection from "@/components/AboutSection";
import TeamSection from "@/components/TeamSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { data: teamVisible = true } = useQuery({
    queryKey: ["team_section_visible"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("value_en")
        .eq("key", "team_section_visible")
        .single();
      return data?.value_en !== "false";
    },
  });

  return (
    <div className="min-h-screen bg-background relative">
      <ParticlesBackground />
      <Navbar teamVisible={teamVisible} />
      <HeroSection />
      <AboutSection />
      <PortfolioSection />
      <TeamSection teamVisible={teamVisible} />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
