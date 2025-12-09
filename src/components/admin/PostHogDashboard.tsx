import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MousePointer,
  Eye,
  ShoppingCart,
  MessageCircle,
  DollarSign,
  Activity,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePostHogMetrics } from '@/hooks/usePostHogMetrics';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard = ({ title, value, change, changeLabel, icon: Icon, description, trend }: MetricCardProps) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={cn('flex items-center text-xs mt-1', trendColor)}>
            <TrendIcon className="mr-1 h-3 w-3" />
            <span className="font-medium">
              {change > 0 ? '+' : ''}
              {change}%
            </span>
            {changeLabel && <span className="ml-1 text-muted-foreground">{changeLabel}</span>}
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
};

interface ConversionFunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropOff?: number;
}

const ConversionFunnel = ({ steps }: { steps: ConversionFunnelStep[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel de Conversión</CardTitle>
        <CardDescription>Landing Page → Signup</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{step.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{step.count.toLocaleString()}</span>
                  <Badge variant="secondary">{step.percentage}%</Badge>
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${step.percentage}%` }}
                />
              </div>
              {step.dropOff !== undefined && index < steps.length - 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Drop-off: {step.dropOff}%
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface ExperimentCardProps {
  name: string;
  status: 'running' | 'draft' | 'completed';
  variants: string[];
  winner?: string;
  significance?: number;
}

const ExperimentCard = ({ name, status, variants, winner, significance }: ExperimentCardProps) => {
  const statusColors = {
    running: 'bg-green-500',
    draft: 'bg-gray-500',
    completed: 'bg-blue-500',
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{name}</h4>
        <Badge className={cn('text-xs', statusColors[status])}>
          {status === 'running' ? 'En Curso' : status === 'draft' ? 'Borrador' : 'Completado'}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Variantes: {variants.join(', ')}</p>
        {winner && <p className="text-green-600 font-medium">Ganador: {winner}</p>}
        {significance && (
          <p>Significancia: {significance}% {significance >= 95 && '✓'}</p>
        )}
      </div>
    </div>
  );
};

export const PostHogDashboard = () => {
  const { metrics, funnelSteps, topEvents, isLoading, error } = usePostHogMetrics();

  const experiments: ExperimentCardProps[] = [
    {
      name: 'WhatsApp Widget Position',
      status: 'running',
      variants: ['bottom-right', 'bottom-left'],
      significance: 87,
    },
    {
      name: 'Hero Headline',
      status: 'completed',
      variants: ['Original', 'Variant A', 'Variant B'],
      winner: 'Variant A',
      significance: 98,
    },
    {
      name: 'Pricing Order',
      status: 'draft',
      variants: ['starter-business-premium', 'business-starter-premium'],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Activity className="h-12 w-12 animate-pulse mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando métricas de PostHog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Métricas en tiempo real de PostHog
          </p>
        </div>
        <Button variant="outline" asChild>
          <a
            href="https://us.posthog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            Ver en PostHog
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar métricas</AlertTitle>
          <AlertDescription>
            {error}. Los datos mostrados pueden estar incompletos.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert for low data */}
      {!error && metrics.pageViews === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin datos disponibles</AlertTitle>
          <AlertDescription>
            Las métricas se mostrarán una vez que los usuarios interactúen con la landing page.
            Los eventos se rastrean automáticamente con PostHog.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Vistas de Página"
          value={metrics.pageViews.toLocaleString()}
          icon={Eye}
          description="Total de visualizaciones"
          trend="neutral"
        />
        <MetricCard
          title="Visitantes Únicos"
          value={metrics.uniqueVisitors.toLocaleString()}
          icon={Users}
          description="Usuarios únicos"
          trend="neutral"
        />
        <MetricCard
          title="Tasa de Conversión"
          value={`${metrics.conversionRate}%`}
          icon={TrendingUp}
          description="Signups completados"
          trend={metrics.conversionRate > 3 ? "up" : "neutral"}
        />
        <MetricCard
          title="Duración Promedio"
          value={metrics.avgSessionDuration}
          icon={Activity}
          description="Tiempo en sesión"
          trend="neutral"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Clicks WhatsApp"
          value={metrics.whatsappClicks.toLocaleString()}
          icon={MessageCircle}
          description="Widget interactions"
          trend="neutral"
        />
        <MetricCard
          title="Vistas Pricing"
          value={metrics.pricingSectionViews.toLocaleString()}
          icon={DollarSign}
          description="Sección de precios"
          trend="neutral"
        />
        <MetricCard
          title="Planes Seleccionados"
          value={metrics.planSelections.toLocaleString()}
          icon={ShoppingCart}
          description="Clicks en planes"
          trend="neutral"
        />
        <MetricCard
          title="Scroll Profundo (75%+)"
          value={`${metrics.scrollDepth75Plus}%`}
          icon={MousePointer}
          description="Engagement alto"
          trend={metrics.scrollDepth75Plus > 50 ? "up" : "neutral"}
        />
      </div>

      {/* Conversion Funnel & Experiments */}
      <div className="grid gap-6 md:grid-cols-2">
        <ConversionFunnel steps={funnelSteps} />

        <Card>
          <CardHeader>
            <CardTitle>Experimentos A/B</CardTitle>
            <CardDescription>Tests activos y completados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {experiments.map((exp, index) => (
              <ExperimentCard key={index} {...exp} />
            ))}
            <Button variant="outline" className="w-full mt-4" asChild>
              <a
                href="https://us.posthog.com/experiments"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                Ver todos los experimentos
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Más Frecuentes (Sesión Actual)</CardTitle>
          <CardDescription>Top interacciones rastreadas por PostHog</CardDescription>
        </CardHeader>
        <CardContent>
          {topEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay eventos registrados aún</p>
              <p className="text-sm mt-1">Los eventos aparecerán cuando los usuarios interactúen con la landing page</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topEvents.map((item, index) => (
                <div key={item.event} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm font-medium">{item.event}</span>
                  </div>
                  <Badge variant="secondary">{item.count.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PostHog Integration Info */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Integración PostHog
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Dashboard conectado a PostHog. Los datos se rastrean en tiempo real y se almacenan localmente en esta sesión.
            Para métricas históricas y avanzadas, accede al panel de PostHog.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">Tracking: Activo</Badge>
            <Badge variant="outline">Session Recording: Disponible</Badge>
            <Badge variant="outline">Feature Flags: Disponible</Badge>
            <Badge variant="outline">A/B Testing: Disponible</Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" size="sm" asChild>
              <a href="https://us.posthog.com/insights" target="_blank" rel="noopener noreferrer">
                Ver Insights
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://us.posthog.com/recordings" target="_blank" rel="noopener noreferrer">
                Ver Grabaciones
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://us.posthog.com/experiments" target="_blank" rel="noopener noreferrer">
                Gestionar Experimentos
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://us.posthog.com/events" target="_blank" rel="noopener noreferrer">
                Ver Todos los Eventos
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
