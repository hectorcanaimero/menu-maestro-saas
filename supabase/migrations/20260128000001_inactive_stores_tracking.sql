-- ============================================================
-- Inactive Stores Tracking System
-- Identifies stores with no activity for notification via n8n
-- ============================================================

-- Table to track inactivity notifications sent
CREATE TABLE IF NOT EXISTS store_inactivity_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  last_order_date TIMESTAMPTZ,
  days_inactive INTEGER,
  notification_sent_at TIMESTAMPTZ,
  notification_type TEXT DEFAULT 'warning', -- 'warning', 'final_warning', 'deactivated'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inactivity_store_id ON store_inactivity_notifications(store_id);
CREATE INDEX idx_inactivity_created_at ON store_inactivity_notifications(created_at);

-- Enable RLS
ALTER TABLE store_inactivity_notifications ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role full access on store_inactivity_notifications"
  ON store_inactivity_notifications
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Function: get_inactive_stores
-- Returns stores with no orders in the given threshold (days)
-- ============================================================
CREATE OR REPLACE FUNCTION get_inactive_stores(days_threshold INTEGER DEFAULT 30)
RETURNS TABLE (
  store_id UUID,
  subdomain TEXT,
  store_name TEXT,
  owner_email TEXT,
  owner_id UUID,
  last_order_date TIMESTAMPTZ,
  days_since_last_order INTEGER,
  total_orders BIGINT,
  already_notified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS store_id,
    s.subdomain,
    s.name AS store_name,
    au.email AS owner_email,
    s.owner_id,
    MAX(o.created_at) AS last_order_date,
    EXTRACT(DAY FROM NOW() - COALESCE(MAX(o.created_at), s.created_at))::INTEGER AS days_since_last_order,
    COUNT(o.id) AS total_orders,
    EXISTS(
      SELECT 1 FROM store_inactivity_notifications sin
      WHERE sin.store_id = s.id
      AND sin.created_at > NOW() - INTERVAL '7 days'
    ) AS already_notified
  FROM stores s
  LEFT JOIN orders o ON s.id = o.store_id
  LEFT JOIN auth.users au ON s.owner_id = au.id
  WHERE s.is_active = true
  GROUP BY s.id, s.subdomain, s.name, au.email, s.owner_id, s.created_at
  HAVING MAX(o.created_at) IS NULL
    OR MAX(o.created_at) < NOW() - (days_threshold || ' days')::INTERVAL
  ORDER BY days_since_last_order DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: mark_inactivity_notified
-- Called by n8n after sending the notification email
-- ============================================================
CREATE OR REPLACE FUNCTION mark_inactivity_notified(
  p_store_id UUID,
  p_days_inactive INTEGER,
  p_notification_type TEXT DEFAULT 'warning'
)
RETURNS void AS $$
BEGIN
  INSERT INTO store_inactivity_notifications (store_id, days_inactive, notification_type, notification_sent_at)
  VALUES (p_store_id, p_days_inactive, p_notification_type, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
