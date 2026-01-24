-- ============================================================================
-- ADD MISSING WHATSAPP AUTOMATION FLAGS
-- ============================================================================
-- Agregar campos para las automatizaciones que faltaban en whatsapp_settings

ALTER TABLE whatsapp_settings
  ADD COLUMN IF NOT EXISTS auto_order_preparing BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_order_out_for_delivery BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_order_delivered BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_order_cancelled BOOLEAN DEFAULT true;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN whatsapp_settings.auto_order_preparing IS 'Enviar notificación automática cuando el pedido pasa a estado "preparing"';
COMMENT ON COLUMN whatsapp_settings.auto_order_out_for_delivery IS 'Enviar notificación automática cuando el pedido pasa a estado "out_for_delivery"';
COMMENT ON COLUMN whatsapp_settings.auto_order_delivered IS 'Enviar notificación automática cuando el pedido pasa a estado "delivered"';
COMMENT ON COLUMN whatsapp_settings.auto_order_cancelled IS 'Enviar notificación automática cuando el pedido pasa a estado "cancelled"';
