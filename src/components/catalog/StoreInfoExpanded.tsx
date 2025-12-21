import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
} from 'lucide-react';
import { FaWhatsapp, FaTelegram, FaTiktok } from 'react-icons/fa6';

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
  };
  return icons[platform] || Globe;
};

interface StoreHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  display_order: number;
}

interface StoreInfoExpandedProps {
  storeName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  businessHours: StoreHour[];
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * StoreInfoExpanded Component
 *
 * Displays detailed store information including business hours, contact details, and description.
 * This component is reused in both mobile (Sheet) and desktop (Popover) layouts.
 *
 * @param storeName - Name of the store
 * @param address - Store address (optional)
 * @param phone - Store phone number (optional, clickable tel: link)
 * @param email - Store email (optional, clickable mailto: link)
 * @param description - Store description (optional)
 * @param businessHours - Array of store hours by day of week
 */
export function StoreInfoExpanded({
  storeName,
  address,
  phone,
  email,
  description,
  businessHours,
}: StoreInfoExpandedProps) {
  // Group hours by day of week
  const groupedHours = businessHours.reduce((acc, hour) => {
    if (!acc[hour.day_of_week]) {
      acc[hour.day_of_week] = [];
    }
    acc[hour.day_of_week].push(hour);
    return acc;
  }, {} as Record<number, typeof businessHours>);

  const currentDay = new Date().getDay();
  const { store } = useStore();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  console.log(store);
  useEffect(() => {
    if (!store?.id) return;

    const fetchSocialLinks = async () => {
      const { data } = await supabase
        .from('social_links')
        .select('*')
        .eq('store_id', store.id)
        .order('display_order', { ascending: true });

      if (data) {
        setSocialLinks(data);
      }
    };

    fetchSocialLinks();
  }, [store?.id]);

  if (!store) return null;

  return (
    <div className="space-y-6 py-4">
      {/* Store Name */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">{storeName}</h3>
      </div>

      {/* Business Hours Section */}
      {businessHours.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Horarios de atención</h4>
          </div>
          <div className="space-y-2 ml-7">
            {DAYS.map((dayName, dayIndex) => {
              const dayHours = groupedHours[dayIndex] || [];
              const isToday = currentDay === dayIndex;

              if (dayHours.length === 0) {
                return (
                  <div
                    key={dayIndex}
                    className={cn('flex justify-between items-center py-2 px-3 rounded-lg', isToday && 'bg-accent')}
                  >
                    <span className={cn('text-sm font-medium', isToday && 'text-primary')}>
                      {dayName}
                      {isToday && ' (Hoy)'}
                    </span>
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  </div>
                );
              }

              return (
                <div
                  key={dayIndex}
                  className={cn('flex justify-between items-start py-2 px-3 rounded-lg', isToday && 'bg-accent')}
                >
                  <span className={cn('text-sm font-medium', isToday && 'text-primary')}>
                    {dayName}
                    {isToday && ' (Hoy)'}
                  </span>
                  <div className="text-sm text-right space-y-1">
                    {dayHours.map((hour, idx) => (
                      <div key={idx}>
                        {hour.open_time.slice(0, 5)} - {hour.close_time.slice(0, 5)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {socialLinks.length > 0 && (
        <div className="mt-6 md:mt-12">
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

      {/* {address && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Dirección</h4>
          </div>
          <p className="text-sm text-muted-foreground ml-7">{address}</p>
        </div>
      )} */}

      {/* Contact Section */}
      {/* {(phone || email) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Contacto</h4>
          </div>
          <div className="space-y-2 ml-7">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline min-h-[44px] md:min-h-0"
              >
                <Phone className="w-4 h-4" />
                <span>{phone}</span>
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline min-h-[44px] md:min-h-0"
              >
                <Mail className="w-4 h-4" />
                <span>{email}</span>
              </a>
            )}
          </div>
        </div>
      )} */}

      {/* Description Section */}
      {/* {description && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Acerca de</h4>
          </div>
          <p className="text-sm text-muted-foreground ml-7 whitespace-pre-line">{description}</p>
        </div>
      )} */}
    </div>
  );
}
