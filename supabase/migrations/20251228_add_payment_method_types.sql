-- Add payment method types and specific fields to payment_methods table

-- Create enum for payment method types
CREATE TYPE payment_method_type AS ENUM ('pago_movil', 'zelle', 'binance', 'otros');

-- Add new columns to payment_methods table
ALTER TABLE public.payment_methods
ADD COLUMN payment_type payment_method_type,
ADD COLUMN payment_details JSONB;

-- Add comment to explain payment_details structure
COMMENT ON COLUMN public.payment_methods.payment_details IS
'Type-specific payment details stored as JSON:
- pago_movil: {bank_code: string, cedula: string, phone: string}
- zelle: {email: string, holder_name: string}
- binance: {key: string}
- otros: {name: string, description: string}';

-- Update existing records to have payment_type = 'otros' (backward compatibility)
UPDATE public.payment_methods
SET payment_type = 'otros',
    payment_details = jsonb_build_object('name', name, 'description', COALESCE(description, ''))
WHERE payment_type IS NULL;

-- Make payment_type NOT NULL after setting defaults
ALTER TABLE public.payment_methods
ALTER COLUMN payment_type SET NOT NULL;
