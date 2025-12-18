-- QUICK FIX: Ejecutar esto en Supabase Dashboard SQL Editor
-- Esto soluciona el problema de login de knaimero@gmail.com

-- 1. Fix: Actualizar función get_user_owned_store() con solo las columnas que existen
-- Primero eliminamos la función existente
DROP FUNCTION IF EXISTS public.get_user_owned_store();

-- Ahora la recreamos retornando JSONB para máxima flexibilidad
CREATE OR REPLACE FUNCTION public.get_user_owned_store()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store JSONB;
BEGIN
  SELECT to_jsonb(s.*) INTO v_store
  FROM public.stores s
  WHERE s.owner_id = auth.uid()
  LIMIT 1;

  RETURN v_store;
END;
$$;

-- 2. Backfill: Asignar rol 'admin' a todos los store owners que no lo tienen
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT s.owner_id, 'admin'::app_role
FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = s.owner_id AND ur.role = 'admin'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. OPCIONAL: Agregar como platform admin (solo si necesitas acceso a /platform-admin)
-- Descomenta las siguientes líneas si quieres acceso a platform-admin:
/*
INSERT INTO public.platform_admins (user_id, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'knaimero@gmail.com'),
  'super_admin',
  true
)
ON CONFLICT (user_id) DO UPDATE
SET is_active = true, role = 'super_admin';
*/

-- VERIFICACIÓN: Ejecuta estas queries para verificar que todo está correcto
-- SELECT id, email FROM auth.users WHERE email = 'knaimero@gmail.com';
-- SELECT * FROM public.stores WHERE subdomain = 'totus';
-- SELECT * FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'knaimero@gmail.com');
