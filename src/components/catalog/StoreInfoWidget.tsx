import { useState } from 'react';
import { ChevronRight, Clock, Star, Dot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StoreRating } from './StoreRating';
import { StoreInfoExpanded } from './StoreInfoExpanded';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import { useMediaQuery } from '@/hooks/useMediaQuery';
interface StoreHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

interface StoreInfoWidgetProps {
  storeId: string;
  storeName: string;
  estimatedDeliveryTime?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  forceStatus?: 'normal' | 'force_open' | 'force_closed' | null;
}

/**
 * StoreInfoWidget Component
 *
 * Main store information widget that displays key details in a collapsed state
 * and expands to show complete information when clicked.
 *
 * - Mobile: Uses Sheet (full-screen drawer)
 * - Desktop: Uses Popover (dropdown below widget)
 *
 * Replaces the featured products section on the catalog home page.
 *
 * @param storeId - Store ID for fetching business hours
 * @param storeName - Name of the store
 * @param estimatedDeliveryTime - Delivery time estimate (e.g., "30min")
 * @param address - Store address (optional)
 * @param phone - Store phone number (optional)
 * @param email - Store email (optional)
 * @param description - Store description (optional)
 * @param forceStatus - Force open/closed status override
 */
export function StoreInfoWidget({
  storeId,
  storeName,
  estimatedDeliveryTime,
  address,
  phone,
  email,
  description,
  forceStatus = 'normal',
}: StoreInfoWidgetProps) {
  const [open, setOpen] = useState(false);
  const { status, loading } = useStoreStatus(storeId, forceStatus);
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (loading) {
    return null;
  }

  // Collapsed widget content
  const CollapsedContent = () => (
    // <Card className="border-0 shadow-sm md:border md:shadow-md">
    //   <CardContent className="px-4 py-3 md:px-6 md:py-4">

    //   </CardContent>
    // </Card>
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-0 md:gap-1">
      {/* Row 1: Name + Rating */}
      <div className="flex items-center gap-0 md:gap-1 flex-wrap">
        <span className="text-lg md:text-xl font-semibold text-foreground">{storeName}</span>
        <Dot />
        <Star className={`fill-yellow-400 text-yellow-400 me-1`} />
        <span className="text-mds md:text-xl text-foreground">4.7</span>
        {/* <StoreRating rating={4.7} reviewCount={124} variant="compact" size="md" /> */}
        {/* Open/Closed Status */}
      </div>

      {/* Row 2: Status + Delivery + Ver más */}
      <div className="flex items-center gap-0 md:gap-4 flex-wrap">
        <Badge
          variant={status.isOpen ? 'default' : 'secondary'}
          className={`font-semibold ${
            status.isOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {status.isOpen ? 'Abierto' : 'Cerrado'}
        </Badge>
        <Dot />
        {/* Delivery Time */}
        {estimatedDeliveryTime && (
          <>
            <div className="flex items-center gap-1.5 text-sm md:text-base text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{estimatedDeliveryTime}</span>
            </div>
            <Dot />
          </>
        )}

        {/* Ver más button */}
        <Button variant="ghost" className="h-11 md:h-10 text-base md:text-sm font-medium gap-0 hover:bg-accent">
          Ver más
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Expanded content
  const expandedContent = (
    <StoreInfoExpanded
      storeName={storeName}
      address={address}
      phone={phone}
      email={email}
      description={description}
      businessHours={status.allHours}
    />
  );

  // Mobile: Use Sheet
  if (isMobile) {
    return (
      <div className="w-full">
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          <CollapsedContent />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{storeName}</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-[calc(100%-4rem)] pb-8">{expandedContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop: Use Popover
  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div>
            <CollapsedContent />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] max-h-[600px] overflow-y-auto" align="center">
          {expandedContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}
