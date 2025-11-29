import { useEffect, useState, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Store as StoreIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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
 * Protects admin routes with three security layers:
 * 1. Client-side session check
 * 2. StoreContext ownership check
 * 3. Server-side RPC verification
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { store, loading: storeLoading, isStoreOwner } = useStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStep, setVerificationStep] = useState<'session' | 'store' | 'authorization' | 'complete'>(
    'session',
  );

  // Retry mechanism for waiting after login
  const reloadAttemptRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    // Reset retry counter when store becomes available
    if (store) {
      reloadAttemptRef.current = 0;
    }
  }, [store]);

  useEffect(() => {
    // Don't verify while store is loading
    if (storeLoading) {
      setVerificationStep('store');
      return;
    }

    // If no store and we haven't exhausted retries, wait and retry
    if (!store && reloadAttemptRef.current < maxRetries) {
      reloadAttemptRef.current += 1;
      console.log(`[ProtectedRoute] No store yet, retry ${reloadAttemptRef.current}/${maxRetries}`);

      const timeout = setTimeout(() => {
        // Force re-run of this effect by updating a dependency indirectly
        // The store context should have reloaded by now
        setIsVerifying(true);
      }, 1000);

      return () => clearTimeout(timeout);
    }

    verifyAccess();
  }, [store?.id, storeLoading]);

  const verifyAccess = async () => {
    try {
      console.log(storeLoading, isVerifying, isAuthorized, authError);
      // LAYER 1: Quick client-side session check
      setVerificationStep('session');
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('No session found:', sessionError);
        navigate('/auth', { replace: true });
        return;
      }

      // LAYER 2: Check if store is available
      setVerificationStep('store');
      console.log(store);
      if (!store) {
        console.warn('[ProtectedRoute] No store found after retries');
        setAuthError('no_store');
        setIsVerifying(false);
        return;
      }

      // LAYER 3: Server-side authorization verification
      setVerificationStep('authorization');
      const { data, error } = (await supabase.rpc('can_access_admin_routes', {
        p_store_id: store.id,
      })) as { data: AuthorizationResult[] | null; error: any };

      if (error) {
        console.error('RPC error:', error);

        // Fallback to client-side check if RPC fails
        if (isStoreOwner) {
          console.warn('RPC failed, falling back to client-side check');
          setIsAuthorized(true);
          setIsVerifying(false);
          return;
        }

        throw new Error('Failed to verify authorization');
      }

      const authResult = data?.[0];

      if (!authResult) {
        throw new Error('No authorization result returned');
      }

      if (!authResult.can_access) {
        console.warn('Authorization denied:', authResult.reason);
        setAuthError(authResult.reason);
        setIsAuthorized(false);

        if (authResult.reason === 'No admin role') {
          toast.error('No tienes permisos de administrador');
        } else if (authResult.reason === 'Not the store owner') {
          toast.error('No tienes permisos para administrar esta tienda');
        }

        navigate('/', { replace: true });
        return;
      }

      // Success
      setVerificationStep('complete');
      setIsAuthorized(true);
      setAuthError(null);
    } catch (error) {
      console.error('Error in verifyAccess:', error);
      setAuthError('verification_error');
      setIsAuthorized(false);
      toast.error('Error verificando permisos');
      navigate('/', { replace: true });
    } finally {
      setIsVerifying(false);
    }
  };
  // Show loading while verifying
  if (storeLoading || isVerifying || isAuthorized === null) {
    return (
      <LoadingScreen
        variant="auth"
        message="Verificando acceso al panel de administración"
        currentStep={
          verificationStep === 'session'
            ? 'Verificando sesión...'
            : verificationStep === 'store'
            ? 'Cargando datos de tienda...'
            : verificationStep === 'authorization'
            ? 'Verificando permisos de acceso...'
            : 'Completado'
        }
        steps={[
          { label: 'Verificar sesión', completed: verificationStep !== 'session' },
          { label: 'Cargar tienda', completed: ['authorization', 'complete'].includes(verificationStep) },
          { label: 'Verificar permisos', completed: verificationStep === 'complete' },
        ]}
      />
    );
  }

  // Show "no store" screen
  if (authError === 'no_store') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <StoreIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No tienes una tienda</h1>
          <p className="text-muted-foreground mb-6">
            Necesitas crear una tienda para acceder al panel de administración.
          </p>
          <Button onClick={() => navigate('/create-store')}>Crear mi tienda</Button>
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
            {authError === 'No admin role' && 'No tienes permisos de administrador.'}
            {authError === 'Not the store owner' && 'No tienes permisos para administrar esta tienda.'}
            {authError === 'verification_error' && 'Error al verificar permisos. Intenta de nuevo.'}
            {!['No admin role', 'Not the store owner', 'verification_error'].includes(authError) && authError}
          </p>
          <Button onClick={() => navigate('/')}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
