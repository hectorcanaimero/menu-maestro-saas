-- Drop the existing unique constraint on email and phone
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_email_phone_key;

-- Add unique constraint only on email (main identifier)
ALTER TABLE public.customers ADD CONSTRAINT customers_email_key UNIQUE (email);

-- Create an index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone) WHERE phone IS NOT NULL;