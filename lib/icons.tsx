import { 
  Film, 
  Palette, 
  Sparkles, 
  Share2, 
  Layers, 
  Megaphone, 
  Briefcase,
  Video,
  Layout,
  Globe,
  Camera,
  Music,
  Zap,
  Star,
  Search,
  MessageSquare,
  Users,
  Settings,
  Mail,
  Phone,
  Monitor,
  Cpu,
  Database,
  Cloud,
  Lock,
  Smartphone
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Film,
  Palette,
  Sparkles,
  Share2,
  Layers,
  Megaphone,
  Briefcase,
  Video,
  Layout,
  Globe,
  Camera,
  Music,
  Zap,
  Star,
  Search,
  MessageSquare,
  Users,
  Settings,
  Mail,
  Phone,
  Monitor,
  Cpu,
  Database,
  Cloud,
  Lock,
  Smartphone
};

export const getIcon = (name: string): LucideIcon => {
  return iconMap[name] || Briefcase;
};
