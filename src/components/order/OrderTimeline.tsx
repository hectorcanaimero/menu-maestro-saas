import { CheckCircle, Clock, ChefHat, Package, Truck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ORDER_TRACKING_STEPS, isStatusCompleted } from '@/lib/orderTracking';
import { H4, Body, Caption } from '@/components/ui/typography';

interface OrderTimelineProps {
  currentStatus: string;
}

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: ChefHat,
  ready: Package,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  // Filter out cancelled status from normal flow
  const steps = ORDER_TRACKING_STEPS.filter((s) => s.status !== 'cancelled');

  // Show cancelled state separately if order is cancelled
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-start gap-4 p-4 border border-destructive rounded-lg bg-destructive/10">
        <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center flex-shrink-0">
          <XCircle className="h-5 w-5 text-destructive-foreground" />
        </div>
        <div>
          <H4 className="text-destructive">Pedido Cancelado</H4>
          <Body size="small" className="text-muted-foreground mt-1">
            Este pedido ha sido cancelado
          </Body>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const Icon = STATUS_ICONS[step.status as keyof typeof STATUS_ICONS];
        const isCompleted = isStatusCompleted(currentStatus, step.status);
        const isCurrent = currentStatus === step.status;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.status} className="relative">
            <div className="flex items-start gap-4 pb-8">
              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    isCompleted
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : isCurrent
                      ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Vertical line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-5 top-10 w-0.5 h-full transition-all',
                      isCompleted ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <H4
                  className={cn(
                    'text-sm',
                    isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </H4>
                <Caption
                  className={cn(
                    'mt-0.5',
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {step.description}
                </Caption>

                {isCurrent && (
                  <Caption className="text-primary font-medium mt-1">
                    Estado actual
                  </Caption>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
