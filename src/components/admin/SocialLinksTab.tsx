import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
} from 'lucide-react';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  display_order: number;
}

interface SocialLinksTabProps {
  storeId: string;
}

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter / X', icon: Twitter },
  { value: 'tiktok', label: 'TikTok', icon: Globe },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'whatsapp', label: 'WhatsApp', icon: Globe },
  { value: 'telegram', label: 'Telegram', icon: Globe },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'website', label: 'Sitio Web', icon: Globe },
  { value: 'other', label: 'Otro', icon: Globe },
];

export const SocialLinksTab = ({ storeId }: SocialLinksTabProps) => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLink, setNewLink] = useState({ platform: '', url: '' });

  useEffect(() => {
    fetchLinks();
  }, [storeId]);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching social links:', error);
      toast.error('Error al cargar redes sociales');
    }
  };

  const handleAddLink = async () => {
    if (!newLink.platform || !newLink.url.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      // Check if platform already exists
      const existingLink = links.find((link) => link.platform === newLink.platform);
      if (existingLink) {
        toast.error('Esta red social ya está agregada');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('social_links').insert({
        store_id: storeId,
        platform: newLink.platform,
        url: newLink.url.trim(),
        display_order: links.length,
      });

      if (error) throw error;

      toast.success('Red social agregada');
      setNewLink({ platform: '', url: '' });
      fetchLinks();
    } catch (error) {
      console.error('Error adding social link:', error);
      toast.error('Error al agregar red social');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('social_links').delete().eq('id', id);

      if (error) throw error;

      toast.success('Red social eliminada');
      fetchLinks();
    } catch (error) {
      console.error('Error deleting social link:', error);
      toast.error('Error al eliminar red social');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUrl = async (id: string, url: string) => {
    if (!url.trim()) return;

    try {
      const { error } = await supabase
        .from('social_links')
        .update({ url: url.trim() })
        .eq('id', id);

      if (error) throw error;
      toast.success('URL actualizada');
    } catch (error) {
      console.error('Error updating social link:', error);
      toast.error('Error al actualizar URL');
    }
  };

  const getPlatformLabel = (platform: string) => {
    return SOCIAL_PLATFORMS.find((p) => p.value === platform)?.label || platform;
  };

  const getPlatformIcon = (platform: string) => {
    const IconComponent = SOCIAL_PLATFORMS.find((p) => p.value === platform)?.icon || Globe;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <Card className="border-0 shadow-none md:border md:shadow-sm">
      <CardContent className="px-4 md:px-6 pt-4 md:pt-6 space-y-4 md:space-y-6">
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-semibold">Redes Sociales</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Agrega tus redes sociales para que los clientes puedan seguirte y contactarte
          </p>
        </div>

        {/* Existing Links */}
        {links.length > 0 && (
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {getPlatformIcon(link.platform)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{getPlatformLabel(link.platform)}</p>
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const updatedLinks = links.map((l) =>
                          l.id === link.id ? { ...l, url: e.target.value } : l
                        );
                        setLinks(updatedLinks);
                      }}
                      onBlur={(e) => handleUpdateUrl(link.id, e.target.value)}
                      placeholder="URL o usuario"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteLink(link.id)}
                  disabled={loading}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Link */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm md:text-base">Agregar nueva red social</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-xs md:text-sm">
                Plataforma
              </Label>
              <Select
                value={newLink.platform}
                onValueChange={(value) => setNewLink({ ...newLink, platform: value })}
              >
                <SelectTrigger id="platform" className="h-10 md:h-9">
                  <SelectValue placeholder="Selecciona una red social" />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.filter(
                    (platform) => !links.some((link) => link.platform === platform.value)
                  ).map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center gap-2">
                        <platform.icon className="w-4 h-4" />
                        {platform.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url" className="text-xs md:text-sm">
                URL o Usuario
              </Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://... o @usuario"
                  className="h-10 md:h-9"
                />
                <Button
                  onClick={handleAddLink}
                  disabled={loading || !newLink.platform || !newLink.url.trim()}
                  className="h-10 md:h-9"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Las redes sociales se mostrarán en el footer y en la información de la tienda
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
