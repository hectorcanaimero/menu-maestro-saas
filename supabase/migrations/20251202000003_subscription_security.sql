-- ============================================================================
-- Migration: Subscription System - Security & RLS Policies
-- Description: Row Level Security policies para sistema de suscripción
-- Created: 2025-12-02
-- Agent: Security Engineer
-- ============================================================================

-- ============================================================================
-- FUNCIONES DE SEGURIDAD
-- ============================================================================

-- FUNCIÓN: is_platform_admin
-- Verifica si el usuario actual es un administrador de la plataforma
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM platform_admins
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- FUNCIÓN: get_admin_role
-- Obtiene el rol del administrador actual (si lo es)
CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM platform_admins
  WHERE user_id = auth.uid()
  AND is_active = true;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- FUNCIÓN: is_super_admin
-- Verifica si el usuario tiene rol de super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM platform_admins
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- RLS POLICIES: subscription_plans
-- ============================================================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Planes visibles públicamente (para la página de pricing)
DROP POLICY IF EXISTS "Plans are publicly readable" ON subscription_plans;
CREATE POLICY "Plans are publicly readable"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Solo platform admins pueden crear planes
DROP POLICY IF EXISTS "Platform admins can insert plans" ON subscription_plans;
CREATE POLICY "Platform admins can insert plans"
  ON subscription_plans FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- Solo platform admins pueden actualizar planes
DROP POLICY IF EXISTS "Platform admins can update plans" ON subscription_plans;
CREATE POLICY "Platform admins can update plans"
  ON subscription_plans FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Solo super admins pueden eliminar planes
DROP POLICY IF EXISTS "Super admins can delete plans" ON subscription_plans;
CREATE POLICY "Super admins can delete plans"
  ON subscription_plans FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- RLS POLICIES: subscriptions
-- ============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Store owners pueden ver su propia suscripción
DROP POLICY IF EXISTS "Store owners can view their subscription" ON subscriptions;
CREATE POLICY "Store owners can view their subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    user_owns_store(store_id) OR is_platform_admin()
  );

-- Platform admins pueden crear suscripciones manualmente
-- (Normalmente se crean via trigger)
DROP POLICY IF EXISTS "Platform admins can create subscriptions" ON subscriptions;
CREATE POLICY "Platform admins can create subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- Platform admins pueden actualizar suscripciones
DROP POLICY IF EXISTS "Platform admins can update subscriptions" ON subscriptions;
CREATE POLICY "Platform admins can update subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Solo super admins pueden eliminar suscripciones
DROP POLICY IF EXISTS "Super admins can delete subscriptions" ON subscriptions;
CREATE POLICY "Super admins can delete subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- RLS POLICIES: payment_validations
-- ============================================================================
ALTER TABLE payment_validations ENABLE ROW LEVEL SECURITY;

-- Store owners pueden ver sus propios pagos
DROP POLICY IF EXISTS "Store owners can view their payments" ON payment_validations;
CREATE POLICY "Store owners can view their payments"
  ON payment_validations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM subscriptions s
      WHERE s.id = payment_validations.subscription_id
      AND user_owns_store(s.store_id)
    )
    OR is_platform_admin()
  );

-- Store owners pueden crear solicitudes de pago
DROP POLICY IF EXISTS "Store owners can create payment requests" ON payment_validations;
CREATE POLICY "Store owners can create payment requests"
  ON payment_validations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM subscriptions s
      WHERE s.id = subscription_id
      AND user_owns_store(s.store_id)
    )
  );

-- Platform admins (y solo ellos) pueden aprobar/rechazar pagos
DROP POLICY IF EXISTS "Platform admins can approve payments" ON payment_validations;
CREATE POLICY "Platform admins can approve payments"
  ON payment_validations FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Solo super admins pueden eliminar registros de pago
DROP POLICY IF EXISTS "Super admins can delete payments" ON payment_validations;
CREATE POLICY "Super admins can delete payments"
  ON payment_validations FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- RLS POLICIES: platform_admins
-- ============================================================================
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Platform admins pueden ver la lista de otros admins
DROP POLICY IF EXISTS "Admins can view other admins" ON platform_admins;
CREATE POLICY "Admins can view other admins"
  ON platform_admins FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Solo super admins pueden crear nuevos admins
DROP POLICY IF EXISTS "Super admins can create admins" ON platform_admins;
CREATE POLICY "Super admins can create admins"
  ON platform_admins FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

-- Solo super admins pueden modificar admins
DROP POLICY IF EXISTS "Super admins can update admins" ON platform_admins;
CREATE POLICY "Super admins can update admins"
  ON platform_admins FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Solo super admins pueden eliminar admins
DROP POLICY IF EXISTS "Super admins can delete admins" ON platform_admins;
CREATE POLICY "Super admins can delete admins"
  ON platform_admins FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- RLS POLICIES: subscription_audit_log
-- ============================================================================
ALTER TABLE subscription_audit_log ENABLE ROW LEVEL SECURITY;

-- Platform admins pueden ver el log de auditoría
DROP POLICY IF EXISTS "Platform admins can view audit log" ON subscription_audit_log;
CREATE POLICY "Platform admins can view audit log"
  ON subscription_audit_log FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Store owners pueden ver cambios de su propia suscripción
DROP POLICY IF EXISTS "Store owners can view their subscription audit" ON subscription_audit_log;
CREATE POLICY "Store owners can view their subscription audit"
  ON subscription_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM subscriptions s
      WHERE s.id = subscription_audit_log.subscription_id
      AND user_owns_store(s.store_id)
    )
  );

-- El sistema puede insertar registros de auditoría
-- (via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "System can insert audit logs" ON subscription_audit_log;
CREATE POLICY "System can insert audit logs"
  ON subscription_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Controlado por funciones SECURITY DEFINER

-- ============================================================================
-- ACTUALIZAR POLÍTICAS DE MÓDULOS EXISTENTES
-- ============================================================================

-- WhatsApp Settings: Solo accesible si el módulo está habilitado
DROP POLICY IF EXISTS "Store owners can view whatsapp settings if enabled" ON whatsapp_settings;
CREATE POLICY "Store owners can view whatsapp settings if enabled"
  ON whatsapp_settings FOR SELECT
  TO authenticated
  USING (
    (user_owns_store(store_id) AND has_module_enabled(store_id, 'whatsapp'))
    OR is_platform_admin()
  );

DROP POLICY IF EXISTS "Store owners can update whatsapp settings if enabled" ON whatsapp_settings;
CREATE POLICY "Store owners can update whatsapp settings if enabled"
  ON whatsapp_settings FOR UPDATE
  TO authenticated
  USING (
    (user_owns_store(store_id) AND has_module_enabled(store_id, 'whatsapp'))
    OR is_platform_admin()
  )
  WITH CHECK (
    (user_owns_store(store_id) AND has_module_enabled(store_id, 'whatsapp'))
    OR is_platform_admin()
  );

DROP POLICY IF EXISTS "Store owners can insert whatsapp settings if enabled" ON whatsapp_settings;
CREATE POLICY "Store owners can insert whatsapp settings if enabled"
  ON whatsapp_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_owns_store(store_id) AND has_module_enabled(store_id, 'whatsapp'))
    OR is_platform_admin()
  );

-- Drivers (Delivery): Solo accesible si el módulo está habilitado
DROP POLICY IF EXISTS "Store owners can manage drivers if enabled" ON drivers;
CREATE POLICY "Store owners can manage drivers if enabled"
  ON drivers FOR ALL
  TO authenticated
  USING (
    (user_owns_store(store_id) AND has_module_enabled(store_id, 'delivery'))
    OR is_platform_admin()
  )
  WITH CHECK (
    (user_owns_store(store_id) AND has_module_enabled(store_id, 'delivery'))
    OR is_platform_admin()
  );

-- ============================================================================
-- TRIGGERS DE AUDITORÍA
-- ============================================================================

-- Trigger para registrar cambios en subscriptions
CREATE OR REPLACE FUNCTION audit_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar cambios significativos
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.status != NEW.status) OR
       (OLD.plan_id != NEW.plan_id) OR
       (OLD.enabled_modules::text != NEW.enabled_modules::text) THEN

      INSERT INTO subscription_audit_log (
        subscription_id,
        action,
        old_values,
        new_values,
        changed_by
      ) VALUES (
        NEW.id,
        CASE
          WHEN OLD.status != NEW.status THEN 'status_changed'
          WHEN OLD.plan_id != NEW.plan_id THEN 'plan_changed'
          WHEN OLD.enabled_modules::text != NEW.enabled_modules::text THEN 'modules_changed'
          ELSE 'updated'
        END,
        jsonb_build_object(
          'status', OLD.status,
          'plan_id', OLD.plan_id,
          'enabled_modules', OLD.enabled_modules
        ),
        jsonb_build_object(
          'status', NEW.status,
          'plan_id', NEW.plan_id,
          'enabled_modules', NEW.enabled_modules
        ),
        auth.uid()
      );
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO subscription_audit_log (
      subscription_id,
      action,
      new_values,
      changed_by
    ) VALUES (
      NEW.id,
      'created',
      jsonb_build_object(
        'status', NEW.status,
        'plan_id', NEW.plan_id
      ),
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_subscription_changes ON subscriptions;
CREATE TRIGGER trigger_audit_subscription_changes
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION audit_subscription_changes();

-- ============================================================================
-- GRANTS para funciones de seguridad
-- ============================================================================

-- Permitir a usuarios autenticados ejecutar funciones de verificación
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION has_module_enabled(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION has_feature_enabled(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_plan_limit(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_store_usage_stats(UUID) TO authenticated;

-- Solo admins pueden ejecutar funciones de aprobación
GRANT EXECUTE ON FUNCTION approve_payment(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_payment(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON FUNCTION is_platform_admin() IS
'Verifica si el usuario actual es un administrador activo de la plataforma';

COMMENT ON FUNCTION get_admin_role() IS
'Retorna el rol del administrador actual: super_admin, support, o billing';

COMMENT ON FUNCTION is_super_admin() IS
'Verifica si el usuario tiene permisos de super_admin';

COMMENT ON FUNCTION audit_subscription_changes() IS
'Registra automáticamente cambios significativos en subscriptions para auditoría';

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
