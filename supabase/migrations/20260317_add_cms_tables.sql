-- Create site_content table
CREATE TABLE site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value_ar TEXT NOT NULL,
  value_en TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: The services table might already exist from Lovable's skeleton, so we use IF NOT EXISTS
-- The current implementation uses static arrays, so we likely need to create it.
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recreate trigger for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_content_updated_at ON site_content;
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON site_content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies for site_content (Public Read, Admin Write)
CREATE POLICY "Public Read Site Content" ON site_content
  FOR SELECT USING (true);

CREATE POLICY "Admin Insert Site Content" ON site_content
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

CREATE POLICY "Admin Update Site Content" ON site_content
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

CREATE POLICY "Admin Delete Site Content" ON site_content
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

-- Policies for services (Public Read, Admin Write)
CREATE POLICY "Public Read Services" ON services
  FOR SELECT USING (true);

CREATE POLICY "Admin Insert Services" ON services
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

CREATE POLICY "Admin Update Services" ON services
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

CREATE POLICY "Admin Delete Services" ON services
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

-- Seed initial site_content (Hero text as example)
INSERT INTO site_content (key, category, value_ar, value_en) VALUES 
('hero_title', 'hero', 'NEXORA', 'NEXORA'),
('hero_subtitle', 'hero', 'نصنع الإبداع الذي يُحدث الفرق', 'Crafting Creativity That Makes a Difference'),
('hero_desc', 'hero', 'فريق تسويقي إبداعي متخصص في بناء الهويات البصرية، إنتاج المحتوى، وإدارة الحملات الرقمية. نحوّل رؤيتك إلى واقع مؤثر.', 'A creative marketing team specializing in brand identity, content production, and digital campaign management. We turn your vision into impactful reality.'),
('about_subtitle', 'about', 'فريق تسويقي إبداعي يبني العلامات التجارية', 'A creative marketing team building brands'),
('about_desc', 'about', 'NEXORA هو فريق تسويقي إبداعي متخصص في بناء الهويات البصرية وإنتاج المحتوى الرقمي عالي الجودة. نقدم حلولاً متكاملة من التصميم والمونتاج إلى إدارة الحملات الإعلانية.', 'NEXORA is a creative marketing team specializing in building visual identities and producing high-quality digital content. We offer integrated solutions from design and editing to advertising campaign management.')
ON CONFLICT (key) DO NOTHING;

-- Seed initial services AND add Project Management
INSERT INTO services (key, title_ar, title_en, description_ar, description_en, icon, display_order) VALUES 
('project_management', 'إدارة المشاريع', 'Project Management', 'إدارة وتخطيط مشاريعك الرقمية باحترافية', 'Professional planning and management of your digital projects', 'Briefcase', 1),
('montage', 'مونتاج احترافي', 'Professional Editing', 'مونتاج فيديو احترافي بأعلى معايير الجودة', 'Professional video editing with the highest quality standards', 'Film', 2),
('motion', 'موشن جرافيك', 'Motion Graphics', 'رسوم متحركة إبداعية تروي قصتك', 'Creative animations that tell your story', 'Sparkles', 3),
('design', 'تصميم إبداعي', 'Creative Design', 'تصاميم مبتكرة تعكس هويتك البصرية', 'Innovative designs that reflect your visual identity', 'Palette', 4),
('social', 'إدارة سوشيال ميديا', 'Social Media Management', 'إدارة شاملة لحساباتك مع محتوى مخصص', 'Comprehensive account management with custom content', 'Share2', 5),
('branding', 'بناء الهوية البصرية', 'Brand Identity', 'هوية بصرية متكاملة تعكس قيم علامتك التجارية', 'Complete visual identity reflecting your brand values', 'Layers', 6),
('campaign', 'حملات إعلانية', 'Ad Campaigns', 'تخطيط وتنفيذ حملات رقمية فعّالة', 'Planning and executing effective digital campaigns', 'Megaphone', 7)
ON CONFLICT (key) DO NOTHING;
