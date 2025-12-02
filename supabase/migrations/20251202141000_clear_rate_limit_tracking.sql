-- =============================================
-- Migration: Clear Rate Limit Tracking
-- Description: Clear all rate limit entries to reset the limits
-- =============================================

-- Clear all rate limit tracking entries
TRUNCATE TABLE public.rate_limit_tracking;

-- Add comment
COMMENT ON TABLE public.rate_limit_tracking IS
'Rate limit tracking table (cleared for development)';
