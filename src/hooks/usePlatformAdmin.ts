import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface PlatformAdminData {
  isAdmin: boolean;
  role: 'super_admin' | 'support' | 'billing' | null;
  isLoading: boolean;
  userId: string | null;
}

/**
 * Hook para verificar si el usuario actual es un administrador de la plataforma
 * Redirige automáticamente si no tiene permisos
 */
export function usePlatformAdmin(requireAuth: boolean = true): PlatformAdminData {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<'super_admin' | 'support' | 'billing' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  async function checkAdminStatus() {
    try {
      setIsLoading(true);

      // Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user) {
        if (requireAuth) {
          navigate('/auth');
        }
        setIsLoading(false);
        return;
      }

      setUserId(session.user.id);

      // Verificar si es platform admin usando la función de base de datos
      const { data: isPlatformAdmin, error: adminError } = await supabase
        .rpc('is_platform_admin');

      if (adminError) {
        console.error('Error checking admin status:', adminError);
        if (requireAuth) {
          navigate('/');
        }
        setIsLoading(false);
        return;
      }

      if (!isPlatformAdmin) {
        console.warn('User is not a platform admin');
        if (requireAuth) {
          navigate('/');
        }
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Obtener el rol específico
      const { data: adminRole, error: roleError } = await supabase
        .rpc('get_admin_role');

      if (roleError) {
        console.error('Error getting admin role:', roleError);
      }

      setIsAdmin(true);
      setRole(adminRole as 'super_admin' | 'support' | 'billing' || null);
      setIsLoading(false);

    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      if (requireAuth) {
        navigate('/');
      }
      setIsLoading(false);
    }
  }

  return {
    isAdmin,
    role,
    isLoading,
    userId,
  };
}

/**
 * Hook simplificado para solo verificar si es admin (sin redirección)
 */
export function useIsPlatformAdmin() {
  return usePlatformAdmin(false);
}
