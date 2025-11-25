import { Clock, MapPin, Phone, Mail, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

interface StoreInfoExpandedProps {
  storeName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  businessHours: StoreHour[];
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

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
  businessHours
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
                    className={cn(
                      "flex justify-between items-center py-2 px-3 rounded-lg",
                      isToday && "bg-accent"
                    )}
                  >
                    <span className={cn("text-sm font-medium", isToday && "text-primary")}>
                      {dayName}
                      {isToday && " (Hoy)"}
                    </span>
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  </div>
                );
              }

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "flex justify-between items-start py-2 px-3 rounded-lg",
                    isToday && "bg-accent"
                  )}
                >
                  <span className={cn("text-sm font-medium", isToday && "text-primary")}>
                    {dayName}
                    {isToday && " (Hoy)"}
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

      {/* Address Section */}
      {address && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Dirección</h4>
          </div>
          <p className="text-sm text-muted-foreground ml-7">{address}</p>
        </div>
      )}

      {/* Contact Section */}
      {(phone || email) && (
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
      )}

      {/* Description Section */}
      {description && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Acerca de</h4>
          </div>
          <p className="text-sm text-muted-foreground ml-7 whitespace-pre-line">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}
