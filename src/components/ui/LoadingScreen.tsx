import { ChefHat, Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  variant?: "default" | "minimal";
}

export function LoadingScreen({
  message = "Cargando...",
  variant = "default"
}: LoadingScreenProps) {
  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <ChefHat className="w-16 h-16 mx-auto animate-pulse text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
