-- =====================================================
-- WhatsApp Notifications Module - Database Schema
-- =====================================================

-- 1. WhatsApp Settings (Configuration per store)
CREATE TABLE public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  -- Evolution API Configuration
  evolution_api_url TEXT,
  evolution_api_key TEXT,
  instance_name TEXT,
  connected_phone TEXT,
  is_connected BOOLEAN DEFAULT false,
  -- Module Configuration
  is_enabled BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'trial')),
  trial_ends_at TIMESTAMPTZ,
  -- Automation toggles
  auto_order_confirmation BOOLEAN DEFAULT true,
  auto_order_ready BOOLEAN DEFAULT true,
  auto_abandoned_cart BOOLEAN DEFAULT false,
  abandoned_cart_delay_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. WhatsApp Credits (Monthly + Extra credits)
CREATE TABLE public.whatsapp_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  monthly_credits INTEGER DEFAULT 50,
  extra_credits INTEGER DEFAULT 0,
  credits_used_this_month INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. WhatsApp Message Templates
CREATE TABLE public.whatsapp_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('order_confirmation', 'order_ready', 'abandoned_cart', 'promotion')),
  template_name TEXT NOT NULL,
  message_body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, template_type)
);

-- 4. WhatsApp Messages History
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('order_confirmation', 'order_ready', 'abandoned_cart', 'promotion', 'campaign', 'manual')),
  message_content TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  campaign_id UUID,
  evolution_message_id TEXT,
  credit_type TEXT DEFAULT 'monthly' CHECK (credit_type IN ('monthly', 'extra')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. WhatsApp Campaigns
CREATE TABLE public.whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message_body TEXT NOT NULL,
  image_url TEXT,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'recent_customers', 'inactive_customers')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Abandoned Carts
CREATE TABLE public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  cart_data JSONB NOT NULL,
  cart_total NUMERIC NOT NULL,
  recovery_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key for campaign_id in messages
ALTER TABLE public.whatsapp_messages 
ADD CONSTRAINT whatsapp_messages_campaign_id_fkey 
FOREIGN KEY (campaign_id) REFERENCES public.whatsapp_campaigns(id) ON DELETE SET NULL;

-- =====================================================
-- Row Level Security Policies
-- =====================================================

ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- WhatsApp Settings Policies
CREATE POLICY "Store owners can manage their whatsapp settings"
ON public.whatsapp_settings FOR ALL
USING (public.user_owns_store(store_id))
WITH CHECK (public.user_owns_store(store_id));

-- WhatsApp Credits Policies
CREATE POLICY "Store owners can view their whatsapp credits"
ON public.whatsapp_credits FOR SELECT
USING (public.user_owns_store(store_id));

CREATE POLICY "Store owners can update their whatsapp credits"
ON public.whatsapp_credits FOR UPDATE
USING (public.user_owns_store(store_id));

-- WhatsApp Message Templates Policies
CREATE POLICY "Store owners can manage their message templates"
ON public.whatsapp_message_templates FOR ALL
USING (public.user_owns_store(store_id))
WITH CHECK (public.user_owns_store(store_id));

-- WhatsApp Messages Policies
CREATE POLICY "Store owners can view their messages"
ON public.whatsapp_messages FOR SELECT
USING (public.user_owns_store(store_id));

CREATE POLICY "Store owners can insert messages"
ON public.whatsapp_messages FOR INSERT
WITH CHECK (public.user_owns_store(store_id));

-- WhatsApp Campaigns Policies
CREATE POLICY "Store owners can manage their campaigns"
ON public.whatsapp_campaigns FOR ALL
USING (public.user_owns_store(store_id))
WITH CHECK (public.user_owns_store(store_id));

-- Abandoned Carts Policies
CREATE POLICY "Store owners can manage abandoned carts"
ON public.abandoned_carts FOR ALL
USING (public.user_owns_store(store_id))
WITH CHECK (public.user_owns_store(store_id));

-- Public policy for cart recovery (using token)
CREATE POLICY "Anyone can view cart by recovery token"
ON public.abandoned_carts FOR SELECT
USING (true);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_whatsapp_messages_store_id ON public.whatsapp_messages(store_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_campaigns_store_id ON public.whatsapp_campaigns(store_id);
CREATE INDEX idx_whatsapp_campaigns_status ON public.whatsapp_campaigns(status);
CREATE INDEX idx_abandoned_carts_store_id ON public.abandoned_carts(store_id);
CREATE INDEX idx_abandoned_carts_reminder_sent ON public.abandoned_carts(reminder_sent) WHERE NOT reminder_sent;
CREATE INDEX idx_abandoned_carts_recovery_token ON public.abandoned_carts(recovery_token);

-- =====================================================
-- Triggers for updated_at
-- =====================================================

CREATE TRIGGER update_whatsapp_settings_updated_at
BEFORE UPDATE ON public.whatsapp_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_credits_updated_at
BEFORE UPDATE ON public.whatsapp_credits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_message_templates_updated_at
BEFORE UPDATE ON public.whatsapp_message_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaigns_updated_at
BEFORE UPDATE ON public.whatsapp_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Function to check and reset monthly credits
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_and_reset_whatsapp_credits(p_store_id UUID)
RETURNS TABLE(monthly_credits INTEGER, extra_credits INTEGER, credits_used INTEGER, credits_available INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Get or create credits record
  SELECT * INTO v_record FROM public.whatsapp_credits WHERE store_id = p_store_id;
  
  IF v_record IS NULL THEN
    INSERT INTO public.whatsapp_credits (store_id)
    VALUES (p_store_id)
    RETURNING * INTO v_record;
  END IF;
  
  -- Check if we need to reset monthly credits
  IF v_record.last_reset_date < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE public.whatsapp_credits
    SET credits_used_this_month = 0,
        last_reset_date = CURRENT_DATE
    WHERE store_id = p_store_id
    RETURNING * INTO v_record;
  END IF;
  
  RETURN QUERY SELECT 
    v_record.monthly_credits,
    v_record.extra_credits,
    v_record.credits_used_this_month,
    (v_record.monthly_credits - v_record.credits_used_this_month + v_record.extra_credits);
END;
$$;

-- =====================================================
-- Function to use a WhatsApp credit
-- =====================================================

CREATE OR REPLACE FUNCTION public.use_whatsapp_credit(p_store_id UUID)
RETURNS TABLE(success BOOLEAN, credit_type TEXT, remaining_credits INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_credits RECORD;
BEGIN
  -- Get current credits
  SELECT * INTO v_credits FROM public.check_and_reset_whatsapp_credits(p_store_id);
  
  -- Check if credits available
  IF v_credits.credits_available <= 0 THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 0, 'No credits available'::TEXT;
    RETURN;
  END IF;
  
  -- Use monthly credit first, then extra
  IF (v_credits.monthly_credits - (SELECT credits_used_this_month FROM whatsapp_credits WHERE store_id = p_store_id)) > 0 THEN
    UPDATE public.whatsapp_credits
    SET credits_used_this_month = credits_used_this_month + 1
    WHERE store_id = p_store_id;
    
    RETURN QUERY SELECT TRUE, 'monthly'::TEXT, v_credits.credits_available - 1, NULL::TEXT;
  ELSE
    UPDATE public.whatsapp_credits
    SET extra_credits = extra_credits - 1
    WHERE store_id = p_store_id;
    
    RETURN QUERY SELECT TRUE, 'extra'::TEXT, v_credits.credits_available - 1, NULL::TEXT;
  END IF;
END;
$$;

-- =====================================================
-- Function to initialize default templates for a store
-- =====================================================

CREATE OR REPLACE FUNCTION public.initialize_whatsapp_templates(p_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Order Confirmation Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body)
  VALUES (
    p_store_id,
    'order_confirmation',
    'Confirmación de Pedido',
    '¡Hola {customer_name}! 🎉

Tu pedido #{order_number} ha sido confirmado.

📦 Total: {order_total}
⏱️ Tiempo estimado: {estimated_time}

¡Gracias por tu compra en {store_name}!'
  ) ON CONFLICT (store_id, template_type) DO NOTHING;
  
  -- Order Ready Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body)
  VALUES (
    p_store_id,
    'order_ready',
    'Pedido Listo',
    '¡Hola {customer_name}! 🚀

Tu pedido #{order_number} está *LISTO*.

{delivery_message}

¡Gracias por preferirnos!'
  ) ON CONFLICT (store_id, template_type) DO NOTHING;
  
  -- Abandoned Cart Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body)
  VALUES (
    p_store_id,
    'abandoned_cart',
    'Carrito Abandonado',
    '¡Hola {customer_name}! 👋

Notamos que dejaste algunos productos en tu carrito de {store_name}.

🛒 Total: {cart_total}

¿Necesitas ayuda para completar tu pedido?
Haz clic aquí para continuar: {recovery_link}'
  ) ON CONFLICT (store_id, template_type) DO NOTHING;
  
  -- Promotion Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body)
  VALUES (
    p_store_id,
    'promotion',
    'Promoción General',
    '¡Hola {customer_name}! 🎁

{promotion_message}

Visítanos en: {store_link}

{store_name}'
  ) ON CONFLICT (store_id, template_type) DO NOTHING;
END;
$$;