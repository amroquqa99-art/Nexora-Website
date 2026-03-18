import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { useDynamicContent } from "@/hooks/useDynamicContent";

const Footer = () => {
  const { t, lang } = useLanguage();
  const { data: content } = useDynamicContent();
  const siteName = content?.site_name?.[lang] || "NEXORA";

  return (
    <footer className="border-t border-border/30 py-10 px-4">
      <div className="container mx-auto text-center flex flex-col items-center">
        <img src="/logo.png" alt={`${siteName} Logo`} className="h-8 w-auto mb-4 opacity-80" />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteName}. {t.footer.rights}.
        </p>
        <Link 
          to="/admin/login" 
          className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors mt-2 inline-block"
        >
          {t.footer.adminLogin}
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
