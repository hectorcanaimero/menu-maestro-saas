# Configuración del Bucket de Comprobantes de Pago

## Problema
El sistema intenta subir comprobantes de pago al bucket `payment-proofs` en Supabase Storage, pero este bucket no existe, resultando en el error:
```
{
  "statusCode": "404",
  "error": "Bucket not found",
  "message": "Bucket not found"
}
```

## Solución

### Opción 1: Crear el bucket desde el panel de Supabase (Recomendado)

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard/project/wdpexjymbiyjqwdttqhz/storage/buckets)
2. Hacer clic en "New bucket"
3. Configurar el bucket con los siguientes valores:
   - **Name**: `payment-proofs`
   - **Public bucket**: ✅ Activado (para que los admins puedan ver los comprobantes)
   - **File size limit**: `5 MB` (5242880 bytes)
   - **Allowed MIME types**:
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
     - `application/pdf`

4. Hacer clic en "Save"

### Opción 2: Usar SQL directamente

Si tienes acceso al SQL Editor de Supabase, ejecuta la migración:

```sql
-- Archivo: supabase/migrations/20251206_create_payment_proofs_bucket.sql

-- Create payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload payment proofs
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow authenticated users to update their own payment proofs
CREATE POLICY "Users can update their own payment proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own payment proofs
CREATE POLICY "Users can delete their own payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to payment proofs (store owners need to see them)
CREATE POLICY "Public read access to payment proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

-- Allow anonymous users to upload payment proofs (for guest checkout)
CREATE POLICY "Anonymous users can upload payment proofs"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'payment-proofs');
```

## Verificación

Una vez creado el bucket, puedes verificar que funciona:

1. Realizar un pedido de prueba en el checkout
2. Subir un comprobante de pago
3. Verificar en Admin > Órdenes que el comprobante se muestra correctamente
4. Hacer clic en el ícono del comprobante para verlo

## Código Relacionado

- Subida de comprobantes: `src/pages/Checkout.tsx` (líneas 427-445)
- Visualización en admin: `src/components/admin/OrdersManager.tsx` (líneas 695-744)
- Visualización en tarjetas: `src/components/admin/OrderCard.tsx` (líneas 178-181)

## Permisos del Bucket

El bucket debe tener las siguientes políticas RLS:

1. **INSERT (authenticated)**: Usuarios autenticados pueden subir comprobantes
2. **INSERT (anon)**: Usuarios anónimos pueden subir comprobantes (checkout sin cuenta)
3. **UPDATE (authenticated)**: Usuarios pueden actualizar sus propios comprobantes
4. **DELETE (authenticated)**: Usuarios pueden eliminar sus propios comprobantes
5. **SELECT (public)**: Cualquiera puede leer los comprobantes (para que los admins los vean)
