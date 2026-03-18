import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, LogIn } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useDynamicContent } from "@/hooks/useDynamicContent";

const Navbar = ({ teamVisible = true }: { teamVisible?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, toggleLanguage, lang } = useLanguage();
  const { data: content } = useDynamicContent();
  const navigate = useNavigate();

  const siteName = content?.site_name?.[lang] || "NEXORA";

  const navItems = [
    { label: t.nav.home, href: "#home" },
    { label: t.nav.portfolio, href: "#portfolio" },
    { label: t.nav.about, href: "#about" },
    ...(teamVisible ? [{ label: t.nav.team, href: "#team" }] : []),
    { label: t.nav.contact, href: "#contact" },
  ];

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer"
            onClick={() => scrollTo("#home")}
          >
            <img src="/logo.png" alt={`${siteName} Logo`} className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,102,0,0.5)]" />
          </motion.div>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm font-medium relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300" />
              </button>
            ))}
            <button
              onClick={() => navigate("/client/login")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              {lang === "ar" ? "بوابة العملاء" : "Client Portal"}
            </button>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === "ar" ? "EN" : "عربي"}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleLanguage} className="p-2 text-muted-foreground hover:text-foreground">
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-muted-foreground hover:text-foreground">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border/30"
          >
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className="block w-full text-start text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { setIsOpen(false); navigate("/client/login"); }}
                className="flex items-center gap-2 w-full py-2 text-primary font-medium"
              >
                <LogIn className="w-4 h-4" />
                {lang === "ar" ? "بوابة العملاء" : "Client Portal"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
