import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Globe, Map } from 'lucide-react';
import { FaWhatsapp, FaTelegram, FaTiktok } from 'react-icons/fa6';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  display_order: number;
}

const getSocialIcon = (platform: string) => {
  const icons: Record = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin,
    tiktok: FaTiktok,
    whatsapp: FaWhatsapp,
    telegram: FaTelegram,
    maps: Map,
  };
  return icons[platform] || Globe;
};

export const Footer = () => {
  const { store } = useStore();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    if (!store?.id) return;

    const fetchSocialLinks = async () => {
      const { data } = await supabase
        .from('social_links')
        .select('*')
        .eq('store_id', store.id)
        .order('display_order', { ascending: true });
      console.log(data);
      if (data) {
        setSocialLinks(data);
      }
    };

    fetchSocialLinks();
  }, [store?.id]);

  if (!store) return null;
  return (
    <footer className="bg-card border-t mt-8 md:mt-12 spac-y-12 pb-24 md:pb-6">
      <div className="container mx-auto p-4 md:px-6 md:py-10">
        {/* Main Footer Content */}
        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="mt-6 md:mt-8">
            <div className="flex justify-center gap-3 flex-wrap">
              {socialLinks.map((link) => {
                const Icon = getSocialIcon(link.platform);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 md:w-9 md:h-9 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    title={link.platform}
                  >
                    <Icon className="w-5 h-5 md:w-4 md:h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Bottom */}
        <div className="border-t mt-4 md:mt-6 pt-6 md:pt-8 text-center">
          <p className="text-sm md:text-base text-muted-foreground">
            © {new Date().getFullYear()}. Todos los derechos reservados.
          </p>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Tienda generada por{' '}
            <a
              href="https://www.pideai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground text-primary"
            >
              PideAI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
