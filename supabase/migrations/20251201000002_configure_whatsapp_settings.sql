-- Migration: Configure WhatsApp Settings for Database Functions
-- Description: Set up runtime configuration for pg_net HTTP calls
-- Created: 2025-12-01

-- ============================================================================
-- IMPORTANT: Configuration is stored in system_settings table
-- ============================================================================

-- Create system_settings table to store configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write system settings
CREATE POLICY "Service role can manage system settings"
  ON system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default placeholder values (to be updated by user)
INSERT INTO system_settings (key, value, description) VALUES
  ('supabase_url', 'https://YOUR_PROJECT_REF.supabase.co', 'Supabase project URL for pg_net HTTP calls'),
  ('supabase_service_role_key', 'YOUR_SERVICE_ROLE_KEY', 'Supabase service role key for authenticated API calls')
ON CONFLICT (key) DO NOTHING;

-- Create helper function to get Supabase URL
CREATE OR REPLACE FUNCTION get_supabase_url()
RETURNS TEXT AS $$
DECLARE
  v_url TEXT;
BEGIN
  SELECT value INTO v_url
  FROM system_settings
  WHERE key = 'supabase_url'
  LIMIT 1;

  IF v_url IS NULL OR v_url = 'https://YOUR_PROJECT_REF.supabase.co' THEN
    RAISE NOTICE 'Supabase URL not configured in system_settings table';
    RETURN NULL;
  END IF;

  RETURN v_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get service role key
CREATE OR REPLACE FUNCTION get_service_role_key()
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
BEGIN
  SELECT value INTO v_key
  FROM system_settings
  WHERE key = 'supabase_service_role_key'
  LIMIT 1;

  IF v_key IS NULL OR v_key = 'YOUR_SERVICE_ROLE_KEY' THEN
    RAISE NOTICE 'Service role key not configured in system_settings table';
    RETURN NULL;
  END IF;

  RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant necessary permissions for pg_net
-- ============================================================================

-- Grant usage on pg_net schema to authenticated users
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Grant execute on net.http_post to trigger functions
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE system_settings IS
'System-wide configuration settings for database functions';

COMMENT ON FUNCTION get_supabase_url() IS
'Helper function to retrieve Supabase URL from system_settings table';

COMMENT ON FUNCTION get_service_role_key() IS
'Helper function to retrieve Supabase service role key from system_settings table';

-- ============================================================================
-- SETUP INSTRUCTIONS
-- ============================================================================

-- Run these commands in Supabase SQL Editor to configure (replace with your actual values):
--
-- UPDATE system_settings SET value = 'https://wdpexjymbiyqwdttqhz.supabase.co' WHERE key = 'supabase_url';
-- UPDATE system_settings SET value = 'YOUR_ACTUAL_SERVICE_ROLE_KEY' WHERE key = 'supabase_service_role_key';
--
-- Verify configuration:
-- SELECT * FROM system_settings;
