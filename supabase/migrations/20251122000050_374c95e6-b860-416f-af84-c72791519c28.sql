-- Create payment proofs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Add payment_proof_url column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

COMMENT ON COLUMN public.orders.payment_proof_url IS 'URL del comprobante de pago subido por el cliente';

-- RLS Policies for payment-proofs bucket

-- Anyone can upload their payment proof
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Users can view their own payment proofs
CREATE POLICY "Users can view their payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Store owners can view payment proofs for their orders
CREATE POLICY "Store owners can view payment proofs for their store"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.stores s ON s.id = o.store_id
    WHERE s.owner_id = auth.uid()
    AND name LIKE '%' || o.id::text || '%'
  )
);
