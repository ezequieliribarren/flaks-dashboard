-- ============================================================
-- Flaks Dashboard – Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id text PRIMARY KEY,
  name text NOT NULL,
  emoji text DEFAULT '🏷️',
  color text DEFAULT '#2196F3',
  rubro text DEFAULT '—',
  contacto text DEFAULT '—',
  ticket text DEFAULT '$0',
  pct text DEFAULT '0%',
  alert text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Services per client
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean DEFAULT true,
  note text,
  amount numeric,
  billing_type text DEFAULT 'recurring' CHECK (billing_type IN ('recurring','one-time','included')),
  start_date text,
  sort_order int DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_services_client ON services(client_id);

-- Objectives
-- type='task'    → lo que antes era monthly[] en el JSON
-- type='monthly' → lo que antes era quarterly[] en el JSON
CREATE TABLE IF NOT EXISTS objectives (
  id text PRIMARY KEY,
  client_id text REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('task','monthly')),
  text text NOT NULL,
  notes text,
  owner_role text DEFAULT 'EZE' CHECK (owner_role IN ('EZE','GER','AMBOS')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','progress','done','blocked')),
  scheduled_at timestamptz,
  scheduled_calendar_id text,
  calendar_event_id text,
  changed_by uuid REFERENCES auth.users(id),
  changed_by_role text CHECK (changed_by_role IN ('EZE','GER','AMBOS')),
  changed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_objectives_client_type ON objectives(client_id, type);

-- Fixed recurring content
CREATE TABLE IF NOT EXISTS fixed_content (
  id text PRIMARY KEY,
  client_id text REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  frequency text CHECK (frequency IN ('weekly','biweekly','monthly')),
  day_week text,
  day_month text,
  time text,
  owner_role text DEFAULT 'GER',
  start_date date,
  calendar_event_id text,
  calendar_id text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fixed_content_client ON fixed_content(client_id);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  role_code text,
  text text NOT NULL,
  ts timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_ts ON activity_log(ts DESC);

-- Team members: mapea auth.users.id ↔ rol EZE/GER/AMBOS
-- AMBOS se inserta con user_id=NULL (es un rol virtual, no tiene login)
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  role_code text UNIQUE NOT NULL CHECK (role_code IN ('EZE','GER','AMBOS')),
  name text NOT NULL,
  color text NOT NULL,
  initials text NOT NULL,
  calendar_id text,
  email text
);

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_full_access" ON clients       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON services      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON objectives    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON fixed_content FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON activity_log  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON team_members  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── updated_at trigger for clients ─────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
