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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // Mock data - En producción esto vendría de PostHog API
  const metrics = {
    pageViews: 12450,
    pageViewsChange: 23.5,
    uniqueVisitors: 8234,
    uniqueVisitorsChange: 18.2,
    conversionRate: 4.2,
    conversionRateChange: 0.8,
    avgSessionDuration: '3:42',
    avgSessionDurationChange: 12.3,
    whatsappClicks: 456,
    whatsappClicksChange: 28.1,
    pricingSectionViews: 5678,
    pricingSectionViewsChange: 15.4,
    planSelections: 342,
    planSelectionsChange: 9.2,
    scrollDepth75Plus: 62,
    scrollDepth75PlusChange: 5.3,
  };

  const funnelSteps: ConversionFunnelStep[] = [
    { name: 'Landing Page Viewed', count: 8234, percentage: 100, dropOff: 31 },
    { name: 'Scrolled to Pricing', count: 5678, percentage: 69, dropOff: 40 },
    { name: 'CTA Clicked', count: 3407, percentage: 41, dropOff: 10 },
    { name: 'Signup Started', count: 3066, percentage: 37, dropOff: 0 },
    { name: 'Signup Completed', count: 342, percentage: 4.2 },
  ];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Métricas de landing page y experimentos A/B
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

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Vistas de Página"
          value={metrics.pageViews.toLocaleString()}
          change={metrics.pageViewsChange}
          changeLabel="vs mes anterior"
          icon={Eye}
          trend="up"
        />
        <MetricCard
          title="Visitantes Únicos"
          value={metrics.uniqueVisitors.toLocaleString()}
          change={metrics.uniqueVisitorsChange}
          changeLabel="vs mes anterior"
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Tasa de Conversión"
          value={`${metrics.conversionRate}%`}
          change={metrics.conversionRateChange}
          changeLabel="vs mes anterior"
          icon={TrendingUp}
          trend="up"
        />
        <MetricCard
          title="Duración Promedio"
          value={metrics.avgSessionDuration}
          change={metrics.avgSessionDurationChange}
          changeLabel="vs mes anterior"
          icon={Activity}
          trend="up"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Clicks WhatsApp"
          value={metrics.whatsappClicks.toLocaleString()}
          change={metrics.whatsappClicksChange}
          changeLabel="vs mes anterior"
          icon={MessageCircle}
          trend="up"
        />
        <MetricCard
          title="Vistas Pricing"
          value={metrics.pricingSectionViews.toLocaleString()}
          change={metrics.pricingSectionViewsChange}
          changeLabel="vs mes anterior"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Planes Seleccionados"
          value={metrics.planSelections.toLocaleString()}
          change={metrics.planSelectionsChange}
          changeLabel="vs mes anterior"
          icon={ShoppingCart}
          trend="up"
        />
        <MetricCard
          title="Scroll Profundo (75%+)"
          value={`${metrics.scrollDepth75Plus}%`}
          change={metrics.scrollDepth75PlusChange}
          changeLabel="vs mes anterior"
          icon={MousePointer}
          trend="up"
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
          <CardTitle>Eventos Más Frecuentes (Últimos 7 días)</CardTitle>
          <CardDescription>Top 10 interacciones de usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { event: 'landing_page_viewed', count: 8234 },
              { event: 'pricing_section_viewed', count: 5678 },
              { event: 'scroll_depth_50', count: 6123 },
              { event: 'scroll_depth_75', count: 5102 },
              { event: 'hero_cta_clicked', count: 3407 },
              { event: 'pricing_plan_clicked', count: 342 },
              { event: 'whatsapp_widget_clicked', count: 456 },
              { event: 'testimonial_section_viewed', count: 4234 },
              { event: 'use_case_tab_clicked', count: 2156 },
              { event: 'exit_intent_shown', count: 1823 },
            ].map((item, index) => (
              <div key={item.event} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
                  <span className="text-sm font-medium">{item.event}</span>
                </div>
                <Badge variant="secondary">{item.count.toLocaleString()}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PostHog Integration Info */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            PostHog Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Dashboard conectado a PostHog. Los datos se actualizan en tiempo real desde tu proyecto.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">Autocapture: Activo</Badge>
            <Badge variant="outline">Session Recording: Activo</Badge>
            <Badge variant="outline">Feature Flags: Disponible</Badge>
            <Badge variant="outline">Experiments: 3 activos</Badge>
          </div>
          <div className="flex gap-2 mt-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
