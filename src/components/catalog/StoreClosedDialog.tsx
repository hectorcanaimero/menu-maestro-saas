import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock, MapPin } from "lucide-react";

interface StoreClosedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName?: string;
  nextOpenTime?: string | null;
  onViewHours?: () => void;
}

export function StoreClosedDialog({
  open,
  onOpenChange,
  storeName,
  nextOpenTime,
  onViewHours,
}: StoreClosedDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-orange-100 dark:bg-orange-950 p-3">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            {storeName || "La tienda"} está cerrada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            <p className="text-base">
              Lo sentimos, actualmente no estamos recibiendo pedidos.
            </p>

            {nextOpenTime && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Próxima apertura:</span>
                </div>
                <p className="text-center font-bold text-lg mt-1">
                  {nextOpenTime}
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Por favor, vuelve durante nuestro horario de atención para realizar tu pedido.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          {onViewHours && (
            <Button
              onClick={onViewHours}
              variant="outline"
              className="w-full"
            >
              Ver Horarios
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Entendido
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
