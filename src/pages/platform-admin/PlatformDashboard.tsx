import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalStores: number;
  activeStores: number;
  trialStores: number;
  pendingPayments: number;
  monthlyRevenue: number;
}

export function PlatformDashboard() {
  // Obtener estadísticas generales
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [storesRes, subscriptionsRes, paymentsRes] = await Promise.all([
        supabase.from('stores').select('id, is_active', { count: 'exact' }),
        supabase.from('subscriptions').select('status, plan_id'),
        supabase.from('payment_validations').select('amount, status').eq('status', 'pending'),
      ]);

      if (storesRes.error) throw storesRes.error;
      if (subscriptionsRes.error) throw subscriptionsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const totalStores = storesRes.count || 0;
      const activeStores = storesRes.data?.filter(s => s.is_active).length || 0;
      const trialStores = subscriptionsRes.data?.filter(s => s.status === 'trial').length || 0;
      const pendingPayments = paymentsRes.count || 0;

      // Calcular ingresos mensuales proyectados (suscripciones activas)
      const activeSubs = subscriptionsRes.data?.filter(s => s.status === 'active') || [];
      const { data: plans } = await supabase.from('subscription_plans').select('id, price_monthly');

      let monthlyRevenue = 0;
      if (plans) {
        activeSubs.forEach(sub => {
          const plan = plans.find(p => p.id === sub.plan_id);
          if (plan) {
            monthlyRevenue += Number(plan.price_monthly);
          }
        });
      }

      return {
        totalStores,
        activeStores,
        trialStores,
        pendingPayments,
        monthlyRevenue,
      } as DashboardStats;
    },
  });

  // Obtener tiendas recientes
  const { data: recentStores, isLoading: storesLoading } = useQuery({
    queryKey: ['recent-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          subdomain,
          created_at,
          subscriptions!inner(
            status,
            plan_id,
            subscription_plans!inner(
              display_name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Obtener trials próximos a expirar
  const { data: expiringTrials, isLoading: trialsLoading } = useQuery({
    queryKey: ['expiring-trials'],
    queryFn: async () => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          trial_ends_at,
          store_id,
          stores!inner(
            name,
            subdomain
          )
        `)
        .eq('status', 'trial')
        .lte('trial_ends_at', sevenDaysFromNow.toISOString())
        .order('trial_ends_at', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    loading
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: any;
    trend?: string;
    loading?: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            {trend && (
              <div className="flex items-center mt-2 text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Administración</h1>
        <p className="text-muted-foreground">
          Vista general de la plataforma y métricas clave
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Tiendas"
          value={stats?.totalStores || 0}
          description={`${stats?.activeStores || 0} activas`}
          icon={Store}
          loading={statsLoading}
        />
        <StatCard
          title="Tiendas en Trial"
          value={stats?.trialStores || 0}
          description="Período de prueba"
          icon={Clock}
          loading={statsLoading}
        />
        <StatCard
          title="Pagos Pendientes"
          value={stats?.pendingPayments || 0}
          description="Por validar"
          icon={DollarSign}
          loading={statsLoading}
        />
        <StatCard
          title="Ingresos Mensuales"
          value={`$${stats?.monthlyRevenue?.toFixed(2) || 0}`}
          description="Proyección actual"
          icon={TrendingUp}
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tiendas Recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Tiendas Recientes</CardTitle>
            <CardDescription>Últimas tiendas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {storesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentStores?.map((store: any) => (
                  <div key={store.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.subdomain}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {store.subscriptions[0]?.subscription_plans?.display_name}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(store.created_at), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
                {!recentStores?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay tiendas recientes
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trials por Expirar */}
        <Card>
          <CardHeader>
            <CardTitle>Trials por Expirar</CardTitle>
            <CardDescription>Próximos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            {trialsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {expiringTrials?.map((trial: any) => {
                  const daysLeft = Math.ceil(
                    (new Date(trial.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div key={trial.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{trial.stores.name}</p>
                        <p className="text-sm text-muted-foreground">{trial.stores.subdomain}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={daysLeft <= 3 ? "destructive" : "warning"}>
                          {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(trial.trial_ends_at), 'dd MMM', { locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!expiringTrials?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay trials por expirar próximamente
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
