import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  timestamp: number;
}

/**
 * Hook to restore Supabase session from URL parameter
 * Used during cross-subdomain authentication redirects
 *
 * Flow:
 * 1. User logs in at www.pideai.com
 * 2. Session token is passed via URL parameter during redirect
 * 3. This hook extracts and restores the session in the new subdomain
 * 4. URL is cleaned to remove the token
 */
export function useSessionRestore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const restoreSession = async () => {
      const sessionToken = searchParams.get('session_token');

      // No token in URL, nothing to restore
      if (!sessionToken) return;

      try {
        // Decode Base64 token
        const decoded = atob(sessionToken);
        const sessionData: SessionData = JSON.parse(decoded);

        // Security check: Token must be recent (< 30 seconds old)
        const tokenAge = Date.now() - sessionData.timestamp;
        if (tokenAge > 30000) {
          console.error('[Session Restore] Token expired, age:', tokenAge);
          toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
          navigate('/auth', { replace: true });
          return;
        }

        console.log('[Session Restore] Restoring session from URL parameter');

        // Restore session in Supabase
        const { error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });

        if (error) {
          console.error('[Session Restore] Failed to restore session:', error);
          toast.error('Error al restaurar sesión. Por favor inicia sesión nuevamente.');
          navigate('/auth', { replace: true });
          return;
        }

        // Success - clean URL by removing token
        searchParams.delete('session_token');
        setSearchParams(searchParams, { replace: true });

        console.log('[Session Restore] Session successfully restored and URL cleaned');

      } catch (error) {
        console.error('[Session Restore] Error decoding or parsing token:', error);
        toast.error('Error al procesar la sesión');
        navigate('/auth', { replace: true });
      }
    };

    restoreSession();
  }, [searchParams, setSearchParams, navigate]);
}
