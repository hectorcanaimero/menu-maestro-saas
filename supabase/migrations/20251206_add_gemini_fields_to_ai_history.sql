-- Add new columns to ai_enhancement_history for Gemini API migration
-- These fields track which model and configuration was used for each enhancement

ALTER TABLE public.ai_enhancement_history
ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'gemini-2.5-flash-image',
ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '1:1',
ADD COLUMN IF NOT EXISTS resolution TEXT DEFAULT '1K';

-- Add comments for documentation
COMMENT ON COLUMN public.ai_enhancement_history.model_used IS 'Gemini model used: gemini-2.5-flash-image or gemini-3-pro-image-preview';
COMMENT ON COLUMN public.ai_enhancement_history.aspect_ratio IS 'Image aspect ratio: 1:1, 4:5, 9:16, 16:9';
COMMENT ON COLUMN public.ai_enhancement_history.resolution IS 'Image resolution: 1K, 2K, or 4K';

-- Create index for querying by model
CREATE INDEX IF NOT EXISTS idx_ai_enhancement_history_model ON public.ai_enhancement_history(model_used);
