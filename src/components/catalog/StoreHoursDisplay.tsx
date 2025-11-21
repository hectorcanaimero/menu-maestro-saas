import { Clock, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { cn } from "@/lib/utils";

interface StoreHoursDisplayProps {
  storeId: string;
  forceStatus: "normal" | "force_open" | "force_closed" | null;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function StoreHoursDisplay({ storeId, forceStatus }: StoreHoursDisplayProps) {
  const { status, loading } = useStoreStatus(storeId, forceStatus);

  if (loading) return null;

  const groupedHours = status.allHours.reduce((acc, hour) => {
    if (!acc[hour.day_of_week]) {
      acc[hour.day_of_week] = [];
    }
    acc[hour.day_of_week].push(hour);
    return acc;
  }, {} as Record<number, typeof status.allHours>);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 hover:bg-accent/50"
        >
          <Clock className="w-4 h-4" />
          <div className="flex items-center gap-2">
            <Badge
              variant={status.isOpen ? "default" : "secondary"}
              className={cn(
                "font-semibold",
                status.isOpen && "bg-green-600 hover:bg-green-700",
                !status.isOpen && "bg-red-600 hover:bg-red-700"
              )}
            >
              {status.isOpen ? "Abierto" : "Cerrado"}
            </Badge>
            {!status.isOpen && status.nextOpenTime && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Abre {status.nextOpenTime}
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Horarios de atención</DialogTitle>
          <DialogDescription>
            {status.forceStatus === "force_open" && (
              <span className="text-green-600 font-medium">
                Tienda forzada a estar abierta
              </span>
            )}
            {status.forceStatus === "force_closed" && (
              <span className="text-red-600 font-medium">
                Tienda forzada a estar cerrada
              </span>
            )}
            {status.forceStatus === "normal" && "Consulta nuestros horarios de atención"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {status.allHours.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay horarios configurados
            </p>
          ) : (
            DAYS.map((dayName, dayIndex) => {
              const dayHours = groupedHours[dayIndex] || [];
              const isToday = new Date().getDay() === dayIndex;

              if (dayHours.length === 0) {
                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "flex justify-between items-center py-2 px-3 rounded-lg",
                      isToday && "bg-accent"
                    )}
                  >
                    <span className={cn("font-medium", isToday && "text-primary")}>
                      {dayName}
                      {isToday && " (Hoy)"}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Cerrado
                    </span>
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
                  <span className={cn("font-medium", isToday && "text-primary")}>
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
            })
          )}
        </div>

        {!status.isOpen && status.nextOpenTime && status.forceStatus === "normal" && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-center">
              <span className="font-medium">Próxima apertura:</span> {status.nextOpenTime}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
