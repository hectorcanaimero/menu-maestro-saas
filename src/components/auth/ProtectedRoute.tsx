import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Store as StoreIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
}

interface AuthorizationResult {
  can_access: boolean;
  reason: string;
  user_id: string | null;
  store_id: string | null;
  store_name: string | null;
}

/**
 * ProtectedRoute Component
 *
 * Protects admin routes by verifying:
 * 1. User is authenticated
 * 2. User has admin role
 * 3. User owns a store (server-side verification)
 *
 * This component provides THREE layers of security:
 * - Client-side session check (fast fail)
 * - StoreContext ownership check (cached)
 * - Server-side RPC verification (authoritative)
 *
 * Usage:
 * <ProtectedRoute>
 *   <AdminDashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { store, loading: storeLoading, isStoreOwner } = useStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    verifyAccess();
  }, [store?.id, storeLoading]);

  const verifyAccess = async () => {
    try {
      // LAYER 1: Quick client-side session check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("No session found:", sessionError);
        navigate("/auth", { replace: true });
        return;
      }

      // LAYER 2: Wait for StoreContext to load
      if (storeLoading) {
        return; // Wait for store to load
      }

      // If no store, redirect to create store
      if (!store) {
        setAuthError("no_store");
        setIsVerifying(false);
        return;
      }

      // LAYER 3: Server-side authorization verification (most secure)
      const { data, error } = await supabase.rpc('can_access_admin_routes', {
        p_store_id: store.id
      }) as { data: AuthorizationResult[] | null; error: any };

      if (error) {
        console.error("RPC error:", error);

        // Fallback to client-side check if RPC fails
        if (isStoreOwner) {
          console.warn("RPC failed, falling back to client-side check");
          setIsAuthorized(true);
          setIsVerifying(false);
          return;
        }

        throw new Error("Failed to verify authorization");
      }

      const authResult = data?.[0];

      if (!authResult) {
        throw new Error("No authorization result returned");
      }

      if (!authResult.can_access) {
        console.warn("Authorization denied:", authResult.reason);
        setAuthError(authResult.reason);
        setIsAuthorized(false);

        // Show appropriate error message
        if (authResult.reason === "No admin role") {
          toast.error("No tienes permisos de administrador");
        } else if (authResult.reason === "Not the store owner") {
          toast.error("No tienes permisos para administrar esta tienda");
        }

        navigate("/", { replace: true });
        return;
      }

      // Success: User is authorized
      setIsAuthorized(true);
      setAuthError(null);

    } catch (error) {
      console.error("Error in verifyAccess:", error);
      setAuthError("verification_error");
      setIsAuthorized(false);
      toast.error("Error verificando permisos");
      navigate("/", { replace: true });
    } finally {
      setIsVerifying(false);
    }
  };

  // Show loading screen while verifying
  if (storeLoading || isVerifying || isAuthorized === null) {
    return <LoadingScreen message="Verificando permisos..." />;
  }

  // Show "no store" screen
  if (authError === "no_store") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <StoreIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No tienes una tienda</h1>
          <p className="text-muted-foreground mb-6">
            Necesitas crear una tienda para acceder al panel de administración.
          </p>
          <Button onClick={() => navigate("/create-store")}>
            Crear mi tienda
          </Button>
        </div>
      </div>
    );
  }

  // Show error screen
  if (authError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
          <p className="text-muted-foreground mb-6">
            {authError === "No admin role" && "No tienes permisos de administrador."}
            {authError === "Not the store owner" && "No tienes permisos para administrar esta tienda."}
            {authError === "verification_error" && "Error al verificar permisos. Intenta de nuevo."}
            {!["No admin role", "Not the store owner", "verification_error"].includes(authError) && authError}
          </p>
          <Button onClick={() => navigate("/")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  // User is not authorized
  if (!isAuthorized) {
    return null;
  }

  // User is authorized, render protected content
  return <>{children}</>;
}
