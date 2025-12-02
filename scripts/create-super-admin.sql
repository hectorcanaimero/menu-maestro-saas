-- ============================================================================
-- CREAR SUPER ADMIN
-- ============================================================================
-- Este script crea un super admin para acceder al panel de administración
-- IMPORTANTE: Reemplaza el email con tu usuario real de Supabase Auth
-- ============================================================================

-- Opción 1: Crear super admin con un email específico
-- Reemplaza 'admin@tudominio.com' con tu email
INSERT INTO platform_admins (user_id, role, is_active, created_at)
SELECT
  id,
  'super_admin'::TEXT,
  true,
  NOW()
FROM auth.users
WHERE email = 'admin@tudominio.com' -- 👈 CAMBIA ESTE EMAIL
ON CONFLICT (user_id) DO UPDATE
SET role = 'super_admin',
    is_active = true,
    updated_at = NOW();

-- Verificar que se creó correctamente
SELECT
  pa.role,
  pa.is_active,
  pa.created_at,
  au.email
FROM platform_admins pa
JOIN auth.users au ON au.id = pa.user_id
WHERE au.email = 'admin@tudominio.com'; -- 👈 CAMBIA ESTE EMAIL

-- ============================================================================
-- Opción 2: Ver todos los usuarios disponibles para elegir
-- ============================================================================
-- Descomenta las siguientes líneas para ver todos los usuarios registrados:

-- SELECT
--   id,
--   email,
--   created_at,
--   email_confirmed_at
-- FROM auth.users
-- ORDER BY created_at DESC;

-- ============================================================================
-- Opción 3: Crear admin de soporte (solo lectura + validar pagos)
-- ============================================================================
-- INSERT INTO platform_admins (user_id, role, is_active)
-- SELECT id, 'support', true
-- FROM auth.users
-- WHERE email = 'soporte@tudominio.com';

-- ============================================================================
-- Opción 4: Crear admin de billing (gestión de suscripciones)
-- ============================================================================
-- INSERT INTO platform_admins (user_id, role, is_active)
-- SELECT id, 'billing', true
-- FROM auth.users
-- WHERE email = 'billing@tudominio.com';

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- Roles disponibles:
--   - super_admin: Acceso total al sistema
--   - support: Solo lectura + validar pagos
--   - billing: Solo gestión de suscripciones y pagos
--
-- Solo super_admin puede crear otros administradores desde el panel
-- ============================================================================
