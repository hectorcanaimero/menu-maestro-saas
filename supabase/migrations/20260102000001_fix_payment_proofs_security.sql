-- ============================================================================
-- Fix Payment Proofs Storage Security
-- Description: Restringe acceso a comprobantes de pago solo a dueños y admins
-- Created: 2026-01-02
-- Priority: CRITICAL - Security vulnerability
-- ============================================================================

-- PASO 1: Eliminar políticas inseguras existentes
DROP POLICY IF EXISTS "Public read access to payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload payment proofs" ON storage.objects;

-- PASO 2: Cambiar bucket a privado
UPDATE storage.buckets
SET public = false
WHERE id = 'payment-proofs';

-- PASO 3: Solo store owners pueden subir sus propios comprobantes
-- Estructura de rutas: payment-proofs/{subscription_id}/{filename}
DROP POLICY IF EXISTS "Store owners can upload payment proofs" ON storage.objects;
CREATE POLICY "Store owners can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  -- Verificar que el usuario es dueño de la tienda asociada a la suscripción
  EXISTS (
    SELECT 1
    FROM subscriptions s
    JOIN stores st ON st.id = s.store_id
    WHERE s.id::TEXT = (storage.foldername(name))[1]
    AND st.owner_id = auth.uid()
  )
);

-- PASO 4: Solo store owners y platform admins pueden ver comprobantes
DROP POLICY IF EXISTS "Store owners and admins can read proofs" ON storage.objects;
CREATE POLICY "Store owners and admins can read proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND (
    -- Platform admins pueden ver todo
    is_platform_admin() OR
    -- Store owners solo ven sus propios comprobantes
    EXISTS (
      SELECT 1
      FROM subscriptions s
      JOIN stores st ON st.id = s.store_id
      WHERE s.id::TEXT = (storage.foldername(name))[1]
      AND st.owner_id = auth.uid()
    )
  )
);

-- PASO 5: Solo dueños pueden actualizar sus propios comprobantes
DROP POLICY IF EXISTS "Store owners can update their payment proofs" ON storage.objects;
CREATE POLICY "Store owners can update their payment proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (
    SELECT 1
    FROM subscriptions s
    JOIN stores st ON st.id = s.store_id
    WHERE s.id::TEXT = (storage.foldername(name))[1]
    AND st.owner_id = auth.uid()
  )
);

-- PASO 6: Solo dueños pueden eliminar sus propios comprobantes
DROP POLICY IF EXISTS "Store owners can delete their payment proofs" ON storage.objects;
CREATE POLICY "Store owners can delete their payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (
    SELECT 1
    FROM subscriptions s
    JOIN stores st ON st.id = s.store_id
    WHERE s.id::TEXT = (storage.foldername(name))[1]
    AND st.owner_id = auth.uid()
  )
);

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================
COMMENT ON POLICY "Store owners can upload payment proofs" ON storage.objects IS
'Permite a los dueños de tienda subir comprobantes de pago solo a su propia carpeta de suscripción';

COMMENT ON POLICY "Store owners and admins can read proofs" ON storage.objects IS
'Los dueños de tienda solo pueden ver sus propios comprobantes. Los platform admins pueden ver todos';

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
