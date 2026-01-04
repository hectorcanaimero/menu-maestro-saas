import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, ImageIcon, History, TrendingUp, Zap } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAICredits } from '@/hooks/useAICredits';
import { useStore } from '@/contexts/StoreContext';
import { motion } from 'framer-motion';

interface EnhancementHistory {
  id: string;
  original_image_url: string;
  enhanced_image_url: string;
  style: string;
  credit_type: string;
  created_at: string | null;
  menu_items?: {
    name: string;
  } | null;
}

const STYLE_LABELS: Record<string, string> = {
  realistic: 'Realista',
  premium: 'Premium',
  animated: 'Animado',
  minimalist: 'Minimalista',
  white_bg: 'Fondo Blanco',
  dark_mode: 'Dark Mode',
};

const AdminAI = () => {
  const navigate = useNavigate();
  const { store } = useStore();
  const { availableCredits, monthlyRemaining, monthlyTotal, extraCredits, loading: creditsLoading } = useAICredits();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [history, setHistory] = useState<EnhancementHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (store?.id && isAdmin) {
      fetchHistory();
    }
  }, [store?.id, isAdmin]);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/auth');
        return;
      }

      setUserEmail(session.user.email || '');

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        toast.error('Error verificando permisos');
        navigate('/');
        return;
      }

      if (!roleData) {
        toast.error('No tienes permisos de administrador');
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!store?.id) return;

    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_enhancement_history')
        .select(
          `
          id,
          original_image_url,
          enhanced_image_url,
          style,
          credit_type,
          created_at,
          menu_items (name)
        `,
        )
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      throw new Error(error as string | undefined);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="w-16 h-16 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const usedPercentage = monthlyTotal > 0 ? ((monthlyTotal - monthlyRemaining) / monthlyTotal) * 100 : 0;

  return (
    <AdminLayout userEmail={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-primary" />
              Estudio Fotográfico con IA
            </h1>
            <p className="text-muted-foreground mt-1">Mejora las fotos de tus productos automáticamente</p>
          </div>
          <Button onClick={() => navigate('/admin/menu-items')}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Ir a Productos
          </Button>
        </div>

        {/* Credits Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Créditos Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{availableCredits}</div>
                <p className="text-xs text-muted-foreground mt-1">Para mejorar imágenes</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Uso Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {monthlyTotal - monthlyRemaining}/{monthlyTotal}
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${usedPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Se renuevan cada mes</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Créditos Extra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{extraCredits}</div>
                <p className="text-xs text-muted-foreground mt-1">$0.05 por crédito adicional</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Features Info */}
        <Card>
          <CardHeader>
            <CardTitle>¿Cómo funciona?</CardTitle>
            <CardDescription>Convierte fotos caseras en imágenes profesionales que venden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2">40 imágenes/mes</h3>
                <p className="text-sm text-muted-foreground">Incluidas en tu plan para mejorar tu catálogo</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2">6 Estilos</h3>
                <p className="text-sm text-muted-foreground">
                  Realista, Premium, Animado, Minimalista, Fondo Blanco, Dark Mode
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2">Fondos Limpios</h3>
                <p className="text-sm text-muted-foreground">Elimina fondos sucios y mejora la presentación</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2">Reemplazo Automático</h3>
                <p className="text-sm text-muted-foreground">Aplica la imagen mejorada directamente al producto</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2">Sin Fotógrafo</h3>
                <p className="text-sm text-muted-foreground">Ahorra tiempo y dinero en sesiones fotográficas</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2">Créditos Extra</h3>
                <p className="text-sm text-muted-foreground">Compra más créditos a $0.05 cada uno</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhancement History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de Mejoras
            </CardTitle>
            <CardDescription>Últimas imágenes mejoradas con IA</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aún no has mejorado ninguna imagen</p>
                <p className="text-sm mt-1">
                  Ve a <strong>Productos</strong> y usa el botón "✨ Mejorar con IA"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="aspect-square relative">
                      <img src={item.enhanced_image_url} alt="Enhanced" className="w-full h-full object-cover" />
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        {STYLE_LABELS[item.style] || item.style}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{item.menu_items?.name || 'Producto eliminado'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('es', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAI;
