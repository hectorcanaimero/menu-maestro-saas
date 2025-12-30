-- Optimize payment_validations queries
-- Add indexes for common query patterns

-- Index for filtering by status (most common query)
CREATE INDEX IF NOT EXISTS idx_payment_validations_status 
ON payment_validations(status);

-- Index for filtering by subscription_id (for joins)
CREATE INDEX IF NOT EXISTS idx_payment_validations_subscription_id 
ON payment_validations(subscription_id);

-- Composite index for status + created_at (for pending payments ordered by date)
CREATE INDEX IF NOT EXISTS idx_payment_validations_status_created_at 
ON payment_validations(status, created_at DESC);

-- Composite index for status + validated_at (for recent validations)
CREATE INDEX IF NOT EXISTS idx_payment_validations_status_validated_at 
ON payment_validations(status, validated_at DESC) 
WHERE validated_at IS NOT NULL;

COMMENT ON INDEX idx_payment_validations_status IS 'Optimize queries filtering by payment status';
COMMENT ON INDEX idx_payment_validations_subscription_id IS 'Optimize joins with subscriptions table';
COMMENT ON INDEX idx_payment_validations_status_created_at IS 'Optimize pending payments query with date ordering';
COMMENT ON INDEX idx_payment_validations_status_validated_at IS 'Optimize recent validations query';
