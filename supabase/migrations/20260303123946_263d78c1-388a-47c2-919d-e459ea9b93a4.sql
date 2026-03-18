
-- Add CRM fields to contact_messages
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS company text DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_type text DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget text DEFAULT '';

-- Add more roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'creative_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'designer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'social_media_manager';

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text DEFAULT '',
  entity_type text DEFAULT '',
  entity_id text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Authenticated can insert logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add rating fields to team_members
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS rating integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
