
ALTER TABLE public.team_members ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow team members to read their own record
CREATE POLICY "Team members can read own record"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow team members to view projects assigned to them
CREATE POLICY "Team members can view assigned projects"
  ON public.client_projects FOR SELECT
  TO authenticated
  USING (
    assigned_team::text LIKE '%' || auth.uid()::text || '%'
    OR EXISTS (SELECT 1 FROM public.team_members WHERE team_members.user_id = auth.uid() AND team_members.id::text IN (SELECT jsonb_array_elements_text(client_projects.assigned_team)))
  );

-- Allow team members to view messages for their assigned projects
CREATE POLICY "Team members can view project messages"
  ON public.project_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.id = project_messages.project_id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );

-- Allow team members to send messages
CREATE POLICY "Team members can send messages"
  ON public.project_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.id = project_messages.project_id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );

-- Allow team members to view project files
CREATE POLICY "Team members can view project files"
  ON public.project_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.id = project_files.project_id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );

-- Allow team members to upload files to assigned projects
CREATE POLICY "Team members can upload files"
  ON public.project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.id = project_files.project_id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );

-- Allow team members to read client profiles for their projects
CREATE POLICY "Team members can read client profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.client_id = profiles.id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );
