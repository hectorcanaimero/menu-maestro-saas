-- =====================================================
-- INSTRUCCIONES PARA LIMPIEZA DE STORAGE
-- =====================================================
-- Este archivo contiene las instrucciones SQL para limpiar
-- los archivos de storage de las tiendas eliminadas.
--
-- IMPORTANTE: Estas queries deben ejecutarse DESPUÉS de
-- aplicar la migración 20260118000001_production_cleanup.sql

-- =====================================================
-- 1. LISTAR ARCHIVOS EN MENU-IMAGES
-- =====================================================

-- Ver todos los archivos en menu-images
SELECT
  name,
  bucket_id,
  (metadata->>'size')::bigint as size_bytes,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'menu-images'
ORDER BY created_at DESC;

-- Verificar archivos huérfanos (sin menu_item asociado)
SELECT
  so.name,
  so.bucket_id,
  (so.metadata->>'size')::bigint as size_bytes,
  so.created_at
FROM storage.objects so
WHERE so.bucket_id = 'menu-images'
  AND NOT EXISTS (
    SELECT 1 FROM menu_items mi
    WHERE mi.image_url LIKE '%' || so.name || '%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM ai_enhancement_history aeh
    WHERE aeh.original_image_url LIKE '%' || so.name || '%'
       OR aeh.enhanced_image_url LIKE '%' || so.name || '%'
  )
ORDER BY so.created_at DESC;

-- =====================================================
-- 2. LISTAR ARCHIVOS EN STORE-ASSETS
-- =====================================================

-- Ver todos los archivos en store-assets
SELECT
  name,
  bucket_id,
  (metadata->>'size')::bigint as size_bytes,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'store-assets'
ORDER BY created_at DESC;

-- Verificar archivos huérfanos (sin store asociado)
SELECT
  so.name,
  so.bucket_id,
  (so.metadata->>'size')::bigint as size_bytes,
  so.created_at
FROM storage.objects so
WHERE so.bucket_id = 'store-assets'
  AND NOT EXISTS (
    SELECT 1 FROM stores s
    WHERE s.logo_url LIKE '%' || so.name || '%'
       OR s.banner_url LIKE '%' || so.name || '%'
  )
ORDER BY so.created_at DESC;

-- =====================================================
-- 3. LISTAR ARCHIVOS EN PAYMENT-PROOFS
-- =====================================================

-- Ver todos los archivos en payment-proofs
SELECT
  name,
  bucket_id,
  (metadata->>'size')::bigint as size_bytes,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'payment-proofs'
ORDER BY created_at DESC;

-- Verificar archivos huérfanos de payment-proofs (sin orden o validación asociada)
SELECT
  so.name,
  so.bucket_id,
  (so.metadata->>'size')::bigint as size_bytes,
  so.created_at
FROM storage.objects so
WHERE so.bucket_id = 'payment-proofs'
  AND NOT EXISTS (
    -- Buscar en orders (payment_proof_url)
    SELECT 1 FROM orders o
    WHERE o.payment_proof_url LIKE '%' || so.name || '%'
  )
  AND NOT EXISTS (
    -- Buscar en payment_validations (proof_image_url)
    SELECT 1 FROM payment_validations pv
    WHERE pv.proof_image_url LIKE '%' || so.name || '%'
  )
  AND NOT EXISTS (
    -- Buscar en delivery_assignments (delivery_photo_url, customer_signature_url)
    SELECT 1 FROM delivery_assignments da
    WHERE da.delivery_photo_url LIKE '%' || so.name || '%'
       OR da.customer_signature_url LIKE '%' || so.name || '%'
  )
ORDER BY so.created_at DESC;

-- =====================================================
-- 4. FUNCIÓN PARA ELIMINAR ARCHIVOS HUÉRFANOS
-- =====================================================

-- ADVERTENCIA: Esta función ELIMINARÁ permanentemente archivos.
-- SOLO ejecutar después de verificar con las queries anteriores.

CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_files(
  p_bucket_id text,
  p_dry_run boolean DEFAULT true
)
RETURNS TABLE (
  file_name text,
  file_size bigint,
  action text
) AS $$
DECLARE
  v_file RECORD;
  v_is_orphan boolean;
  v_deleted_count int := 0;
BEGIN
  FOR v_file IN
    SELECT
      name,
      (metadata->>'size')::bigint as size
    FROM storage.objects
    WHERE bucket_id = p_bucket_id
  LOOP
    v_is_orphan := false;

    -- Verificar según el bucket
    IF p_bucket_id = 'menu-images' THEN
      -- Verificar si está huérfano
      v_is_orphan := NOT EXISTS (
        SELECT 1 FROM menu_items mi
        WHERE mi.image_url LIKE '%' || v_file.name || '%'
      ) AND NOT EXISTS (
        SELECT 1 FROM ai_enhancement_history aeh
        WHERE aeh.original_image_url LIKE '%' || v_file.name || '%'
           OR aeh.enhanced_image_url LIKE '%' || v_file.name || '%'
      );

    ELSIF p_bucket_id = 'store-assets' THEN
      v_is_orphan := NOT EXISTS (
        SELECT 1 FROM stores s
        WHERE s.logo_url LIKE '%' || v_file.name || '%'
           OR s.banner_url LIKE '%' || v_file.name || '%'
      );

    ELSIF p_bucket_id = 'payment-proofs' THEN
      v_is_orphan := NOT EXISTS (
        SELECT 1 FROM orders o WHERE o.payment_proof_url LIKE '%' || v_file.name || '%'
      ) AND NOT EXISTS (
        SELECT 1 FROM payment_validations pv WHERE pv.proof_image_url LIKE '%' || v_file.name || '%'
      ) AND NOT EXISTS (
        SELECT 1 FROM delivery_assignments da
        WHERE da.delivery_photo_url LIKE '%' || v_file.name || '%'
           OR da.customer_signature_url LIKE '%' || v_file.name || '%'
      );
    END IF;

    IF v_is_orphan THEN
      IF p_dry_run THEN
        -- Solo reportar
        file_name := v_file.name;
        file_size := v_file.size;
        action := 'WOULD DELETE (dry-run)';
        RETURN NEXT;
      ELSE
        -- Eliminar realmente
        DELETE FROM storage.objects
        WHERE bucket_id = p_bucket_id AND name = v_file.name;

        file_name := v_file.name;
        file_size := v_file.size;
        action := 'DELETED';
        v_deleted_count := v_deleted_count + 1;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;

  -- Retornar resumen
  file_name := 'TOTAL';
  file_size := v_deleted_count;
  action := CASE WHEN p_dry_run THEN 'DRY RUN COMPLETE' ELSE 'CLEANUP COMPLETE' END;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. USO DE LA FUNCIÓN DE LIMPIEZA
-- =====================================================

-- PASO 1: Ejecutar en modo DRY RUN para ver qué se eliminaría
SELECT * FROM cleanup_orphaned_storage_files('menu-images', true);
SELECT * FROM cleanup_orphaned_storage_files('store-assets', true);
SELECT * FROM cleanup_orphaned_storage_files('payment-proofs', true);

-- PASO 2: Si todo se ve correcto, ejecutar la limpieza real
-- ADVERTENCIA: Esto ELIMINARÁ archivos permanentemente
-- SELECT * FROM cleanup_orphaned_storage_files('menu-images', false);
-- SELECT * FROM cleanup_orphaned_storage_files('store-assets', false);
-- SELECT * FROM cleanup_orphaned_storage_files('payment-proofs', false);

-- =====================================================
-- 6. LIMPIEZA MANUAL ALTERNATIVA (Dashboard)
-- =====================================================

/*
Si prefieres hacerlo manualmente desde el Dashboard de Supabase:

1. Ve a Storage > menu-images
2. Filtra por fecha de creación
3. Revisa los archivos que pertenecían a tiendas eliminadas
4. Elimínalos manualmente

Repite para los otros buckets: store-assets, payment-proofs

IMPORTANTE: Conserva SOLO los archivos de:
- Tienda "totus" (demo)
- Archivos del sistema (si los hay)
*/

-- =====================================================
-- 7. ESTADÍSTICAS DE STORAGE
-- =====================================================

-- Ver tamaño total por bucket
SELECT
  bucket_id,
  COUNT(*) as total_files,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- Ver archivos más grandes
SELECT
  bucket_id,
  name,
  pg_size_pretty((metadata->>'size')::bigint) as size,
  created_at,
  updated_at
FROM storage.objects
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 20;
