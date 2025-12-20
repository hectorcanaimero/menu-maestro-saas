-- Create social_links table for storing store social media links
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'whatsapp', 'telegram', 'linkedin', 'website', 'other')),
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique platform per store
  UNIQUE(store_id, platform)
);

-- Add RLS policies
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view social links for active stores
CREATE POLICY "Anyone can view social links for active stores"
  ON social_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = social_links.store_id
      AND stores.is_active = true
    )
  );

-- Policy: Store owners can manage their social links
CREATE POLICY "Store owners can manage their social links"
  ON social_links
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM stores WHERE id = social_links.store_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM stores WHERE id = social_links.store_id
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_social_links_store_id ON social_links(store_id);
CREATE INDEX IF NOT EXISTS idx_social_links_display_order ON social_links(store_id, display_order);

-- Add trigger to update updated_at
CREATE TRIGGER update_social_links_updated_at
  BEFORE UPDATE ON social_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE social_links IS 'Store social media links and online presence';
COMMENT ON COLUMN social_links.platform IS 'Social media platform type';
COMMENT ON COLUMN social_links.url IS 'URL or username for the social media platform';
COMMENT ON COLUMN social_links.display_order IS 'Order in which links are displayed (lower numbers first)';
