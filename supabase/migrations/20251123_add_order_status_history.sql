-- ============================================
-- Migration: Add Order Status History & Audit Trail
-- Date: 2025-11-23
-- Issue: #8
-- ============================================

-- Create order_status_history table
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for fast lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id
  ON public.order_status_history(order_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_store_id
  ON public.order_status_history(store_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at
  ON public.order_status_history(changed_at DESC);

-- Add comments for documentation
-- ============================================
COMMENT ON TABLE public.order_status_history IS 'Audit trail for order status changes';
COMMENT ON COLUMN public.order_status_history.order_id IS 'Reference to the order';
COMMENT ON COLUMN public.order_status_history.from_status IS 'Previous status (NULL for initial status)';
COMMENT ON COLUMN public.order_status_history.to_status IS 'New status';
COMMENT ON COLUMN public.order_status_history.changed_by IS 'User who made the change';
COMMENT ON COLUMN public.order_status_history.changed_at IS 'When the change occurred';
COMMENT ON COLUMN public.order_status_history.notes IS 'Optional notes about the change';
COMMENT ON COLUMN public.order_status_history.store_id IS 'Store ID for RLS policies';

-- Enable Row Level Security
-- ============================================
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Store owners can view their order history
-- ============================================
CREATE POLICY "Store owners can view their order history"
  ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING (
    public.user_owns_store(store_id)
  );

-- RLS Policy: Store owners can insert order history
-- ============================================
CREATE POLICY "Store owners can insert order history"
  ON public.order_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_owns_store(store_id)
  );

-- Trigger Function: Auto-log order status changes
-- ============================================
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if status has actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      from_status,
      to_status,
      store_id,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.store_id,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION public.log_order_status_change() IS 'Automatically logs order status changes to order_status_history table';

-- Create Trigger: Log status changes on orders table
-- ============================================
DROP TRIGGER IF EXISTS order_status_change_trigger ON public.orders;

CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- Trigger for initial status on INSERT
-- ============================================
CREATE OR REPLACE FUNCTION public.log_initial_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log initial status when order is created
  INSERT INTO public.order_status_history (
    order_id,
    from_status,
    to_status,
    store_id,
    changed_by
  ) VALUES (
    NEW.id,
    NULL,  -- No previous status
    NEW.status,
    NEW.store_id,
    auth.uid()
  );

  RETURN NEW;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION public.log_initial_order_status() IS 'Logs the initial status when an order is created';

-- Create Trigger: Log initial status on order creation
-- ============================================
DROP TRIGGER IF EXISTS order_initial_status_trigger ON public.orders;

CREATE TRIGGER order_initial_status_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_initial_order_status();

-- Analytics View: Average time per status
-- ============================================
-- First create a CTE to calculate time differences, then aggregate
CREATE OR REPLACE VIEW public.order_status_analytics AS
WITH status_durations AS (
  SELECT
    store_id,
    order_id,
    to_status,
    changed_at,
    LEAD(changed_at) OVER (PARTITION BY order_id ORDER BY changed_at) as next_change,
    EXTRACT(EPOCH FROM (
      LEAD(changed_at) OVER (PARTITION BY order_id ORDER BY changed_at) - changed_at
    )) / 60 as minutes_in_status
  FROM public.order_status_history
)
SELECT
  store_id,
  to_status,
  COUNT(*) as status_count,
  AVG(minutes_in_status) as avg_minutes_in_status,
  MIN(minutes_in_status) as min_minutes_in_status,
  MAX(minutes_in_status) as max_minutes_in_status
FROM status_durations
WHERE minutes_in_status IS NOT NULL  -- Exclude final status (no next change)
GROUP BY store_id, to_status;

-- Comment on view
COMMENT ON VIEW public.order_status_analytics IS 'Analytics: Average time spent in each order status (in minutes)';

-- Grant permissions
-- ============================================
GRANT SELECT ON public.order_status_analytics TO authenticated;
