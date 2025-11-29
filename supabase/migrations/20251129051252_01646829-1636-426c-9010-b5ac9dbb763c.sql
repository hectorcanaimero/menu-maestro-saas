-- Create table for store AI credits
CREATE TABLE public.store_ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
  monthly_credits INTEGER DEFAULT 40 NOT NULL,
  extra_credits INTEGER DEFAULT 0 NOT NULL,
  credits_used_this_month INTEGER DEFAULT 0 NOT NULL,
  last_reset_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for AI enhancement history
CREATE TABLE public.ai_enhancement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  original_image_url TEXT NOT NULL,
  enhanced_image_url TEXT NOT NULL,
  style TEXT NOT NULL,
  prompt_used TEXT,
  credit_type TEXT DEFAULT 'monthly' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_enhancement_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_ai_credits
CREATE POLICY "Store owners can view their credits"
ON public.store_ai_credits
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = store_ai_credits.store_id
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Store owners can insert their credits"
ON public.store_ai_credits
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = store_ai_credits.store_id
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Store owners can update their credits"
ON public.store_ai_credits
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = store_ai_credits.store_id
  AND stores.owner_id = auth.uid()
));

-- RLS Policies for ai_enhancement_history
CREATE POLICY "Store owners can view their enhancement history"
ON public.ai_enhancement_history
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = ai_enhancement_history.store_id
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "Store owners can insert enhancement history"
ON public.ai_enhancement_history
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = ai_enhancement_history.store_id
  AND stores.owner_id = auth.uid()
));

-- Create trigger for updating updated_at
CREATE TRIGGER update_store_ai_credits_updated_at
BEFORE UPDATE ON public.store_ai_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ai_enhancement_history_store_id ON public.ai_enhancement_history(store_id);
CREATE INDEX idx_ai_enhancement_history_menu_item_id ON public.ai_enhancement_history(menu_item_id);
CREATE INDEX idx_store_ai_credits_store_id ON public.store_ai_credits(store_id);