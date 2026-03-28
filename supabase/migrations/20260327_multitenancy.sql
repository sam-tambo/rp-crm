-- ============================================================
-- RP CRM — Multi-tenancy Migration (CORRECTED)
-- ALL tables (entities + workspace) live in the 'crm' schema
-- because the Supabase client is configured with schema: 'crm'
-- Run in: Supabase Dashboard → SQL Editor
-- Project: gfpyhleenbexsroheuig
-- ============================================================

-- 1. WORKSPACES TABLE (crm schema)
CREATE TABLE IF NOT EXISTS crm.workspaces (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

-- 2. USER PROFILES TABLE (crm schema)
CREATE TABLE IF NOT EXISTS crm.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- 3. WORKSPACE MEMBERS TABLE (crm schema)
CREATE TABLE IF NOT EXISTS crm.workspace_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id uuid REFERENCES crm.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 4. ADD workspace_id TO CRM ENTITY TABLES
ALTER TABLE crm.companies  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES crm.workspaces(id) ON DELETE CASCADE;
ALTER TABLE crm.contacts   ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES crm.workspaces(id) ON DELETE CASCADE;
ALTER TABLE crm.deals      ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES crm.workspaces(id) ON DELETE CASCADE;
ALTER TABLE crm.activities ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES crm.workspaces(id) ON DELETE CASCADE;

-- 5. CREATE THE DEFAULT POCARGIL WORKSPACE
INSERT INTO crm.workspaces (name, slug)
VALUES ('Pocargil', 'pocargil')
ON CONFLICT (slug) DO NOTHING;

-- 6. MIGRATE ALL EXISTING RECORDS TO THE DEFAULT WORKSPACE
UPDATE crm.companies  SET workspace_id = (SELECT id FROM crm.workspaces WHERE slug = 'pocargil') WHERE workspace_id IS NULL;
UPDATE crm.contacts   SET workspace_id = (SELECT id FROM crm.workspaces WHERE slug = 'pocargil') WHERE workspace_id IS NULL;
UPDATE crm.deals      SET workspace_id = (SELECT id FROM crm.workspaces WHERE slug = 'pocargil') WHERE workspace_id IS NULL;
UPDATE crm.activities SET workspace_id = (SELECT id FROM crm.workspaces WHERE slug = 'pocargil') WHERE workspace_id IS NULL;

-- 7. ADD ALL EXISTING AUTH USERS AS OWNERS
INSERT INTO crm.workspace_members (workspace_id, user_id, role)
SELECT (SELECT id FROM crm.workspaces WHERE slug = 'pocargil'), id, 'owner'
FROM auth.users
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 8. CREATE USER PROFILES FOR ALL EXISTING USERS
INSERT INTO crm.user_profiles (id, full_name, email)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 9. TRIGGER: auto-create profile + add to workspace when new user signs up
CREATE OR REPLACE FUNCTION crm.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO crm.user_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  IF (NEW.raw_user_meta_data->>'workspace_id') IS NOT NULL THEN
    INSERT INTO crm.workspace_members (workspace_id, user_id, role, invited_by)
    VALUES (
      (NEW.raw_user_meta_data->>'workspace_id')::uuid,
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
      CASE
        WHEN (NEW.raw_user_meta_data->>'invited_by') IS NOT NULL
        THEN (NEW.raw_user_meta_data->>'invited_by')::uuid
        ELSE NULL
      END
    )
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION crm.handle_new_user();

-- 10. UPDATED_AT trigger for user_profiles
CREATE OR REPLACE FUNCTION crm.update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profile_updated_at ON crm.user_profiles;
CREATE TRIGGER set_user_profile_updated_at
  BEFORE UPDATE ON crm.user_profiles
  FOR EACH ROW EXECUTE FUNCTION crm.update_user_profile_updated_at();

-- 11. ENABLE RLS ON NEW TABLES
ALTER TABLE crm.workspaces       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.user_profiles    ENABLE ROW LEVEL SECURITY;

-- 12. RLS POLICIES — WORKSPACES
DROP POLICY IF EXISTS "members_can_read_workspace"  ON crm.workspaces;
CREATE POLICY "members_can_read_workspace" ON crm.workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owners_can_update_workspace" ON crm.workspaces;
CREATE POLICY "owners_can_update_workspace" ON crm.workspaces
  FOR UPDATE USING (
    id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- 13. RLS POLICIES — WORKSPACE_MEMBERS
DROP POLICY IF EXISTS "members_can_read_members"  ON crm.workspace_members;
CREATE POLICY "members_can_read_members" ON crm.workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admins_can_insert_members" ON crm.workspace_members;
CREATE POLICY "admins_can_insert_members" ON crm.workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM crm.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "admins_can_update_members" ON crm.workspace_members;
CREATE POLICY "admins_can_update_members" ON crm.workspace_members
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM crm.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "admins_can_delete_members" ON crm.workspace_members;
CREATE POLICY "admins_can_delete_members" ON crm.workspace_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM crm.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND user_id != auth.uid()
  );

-- 14. RLS POLICIES — USER_PROFILES
DROP POLICY IF EXISTS "profiles_readable_by_authenticated" ON crm.user_profiles;
CREATE POLICY "profiles_readable_by_authenticated" ON crm.user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "users_update_own_profile" ON crm.user_profiles;
CREATE POLICY "users_update_own_profile" ON crm.user_profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_by_trigger" ON crm.user_profiles;
CREATE POLICY "profiles_insert_by_trigger" ON crm.user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 15. UPDATE RLS POLICIES ON CRM ENTITY TABLES (workspace-scoped)

-- Companies
DROP POLICY IF EXISTS "authenticated_all"                        ON crm.companies;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON crm.companies;
DROP POLICY IF EXISTS "Enable all for authenticated users"       ON crm.companies;
DROP POLICY IF EXISTS "workspace_select_companies"               ON crm.companies;
DROP POLICY IF EXISTS "workspace_insert_companies"               ON crm.companies;
DROP POLICY IF EXISTS "workspace_update_companies"               ON crm.companies;
DROP POLICY IF EXISTS "workspace_delete_companies"               ON crm.companies;

CREATE POLICY "workspace_select_companies" ON crm.companies
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_insert_companies" ON crm.companies
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_update_companies" ON crm.companies
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_delete_companies" ON crm.companies
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );

-- Contacts
DROP POLICY IF EXISTS "authenticated_all"                        ON crm.contacts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON crm.contacts;
DROP POLICY IF EXISTS "Enable all for authenticated users"       ON crm.contacts;
DROP POLICY IF EXISTS "workspace_select_contacts"                ON crm.contacts;
DROP POLICY IF EXISTS "workspace_insert_contacts"                ON crm.contacts;
DROP POLICY IF EXISTS "workspace_update_contacts"                ON crm.contacts;
DROP POLICY IF EXISTS "workspace_delete_contacts"                ON crm.contacts;

CREATE POLICY "workspace_select_contacts" ON crm.contacts
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_insert_contacts" ON crm.contacts
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_update_contacts" ON crm.contacts
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_delete_contacts" ON crm.contacts
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );

-- Deals
DROP POLICY IF EXISTS "authenticated_all"                        ON crm.deals;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON crm.deals;
DROP POLICY IF EXISTS "Enable all for authenticated users"       ON crm.deals;
DROP POLICY IF EXISTS "workspace_select_deals"                   ON crm.deals;
DROP POLICY IF EXISTS "workspace_insert_deals"                   ON crm.deals;
DROP POLICY IF EXISTS "workspace_update_deals"                   ON crm.deals;
DROP POLICY IF EXISTS "workspace_delete_deals"                   ON crm.deals;

CREATE POLICY "workspace_select_deals" ON crm.deals
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_insert_deals" ON crm.deals
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_update_deals" ON crm.deals
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_delete_deals" ON crm.deals
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );

-- Activities
DROP POLICY IF EXISTS "authenticated_all"                        ON crm.activities;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON crm.activities;
DROP POLICY IF EXISTS "Enable all for authenticated users"       ON crm.activities;
DROP POLICY IF EXISTS "workspace_select_activities"              ON crm.activities;
DROP POLICY IF EXISTS "workspace_insert_activities"              ON crm.activities;

CREATE POLICY "workspace_select_activities" ON crm.activities
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "workspace_insert_activities" ON crm.activities
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM crm.workspace_members WHERE user_id = auth.uid())
  );

-- 16. Grant new tables to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON crm.workspaces        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crm.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON crm.user_profiles     TO authenticated;

-- ============================================================
-- DONE. Verify with:
-- SELECT count(*) FROM crm.workspaces;
-- SELECT count(*) FROM crm.workspace_members;
-- SELECT count(*) FROM crm.companies WHERE workspace_id IS NOT NULL;
-- ============================================================
