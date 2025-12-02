import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Store, Calendar, AlertCircle, CheckCircle, Clock, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Subscription {
  id: string;
  store_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'pending_payment' | 'past_due' | 'cancelled' | 'suspended';
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  whatsapp_enabled: boolean;
  delivery_enabled: boolean;
  created_at: string;
  stores: {
    name: string;
    subdomain: string;
    email: string;
    owner_id: string;
  };
  subscription_plans: {
    name: string;
    display_name: string;
    price_monthly: number;
  };
}

function SubscriptionsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [moduleType, setModuleType] = useState<'whatsapp' | 'delivery' | null>(null);

  // Fetch all subscriptions
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['all-subscriptions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          stores (name, subdomain, email, owner_id),
          subscription_plans (name, display_name, price_monthly)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Subscription[];
    },
  });

  // Toggle module mutation
  const toggleModuleMutation = useMutation({
    mutationFn: async ({ subscriptionId, module, enable }: { subscriptionId: string; module: 'whatsapp' | 'delivery'; enable: boolean }) => {
      const column = module === 'whatsapp' ? 'whatsapp_enabled' : 'delivery_enabled';

      const { data, error } = await supabase
        .from('subscriptions')
        .update({ [column]: enable })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.enable ? 'Módulo habilitado' : 'Módulo deshabilitado',
        description: `El módulo ${variables.module === 'whatsapp' ? 'WhatsApp' : 'Delivery'} ha sido ${variables.enable ? 'habilitado' : 'deshabilitado'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      setShowModuleDialog(false);
      setSelectedSubscription(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });

  const getStatusBadge = (status: Subscription['status']) => {
    const statusConfig = {
      trial: { icon: Clock, label: 'Trial', variant: 'outline' as const, className: 'border-blue-500 text-blue-700' },
      active: { icon: CheckCircle, label: 'Activa', variant: 'default' as const, className: 'bg-green-600' },
      pending_payment: { icon: Clock, label: 'Pago Pendiente', variant: 'secondary' as const, className: '' },
      past_due: { icon: AlertCircle, label: 'Vencida', variant: 'destructive' as const, className: '' },
      cancelled: { icon: Ban, label: 'Cancelada', variant: 'outline' as const, className: '' },
      suspended: { icon: Ban, label: 'Suspendida', variant: 'destructive' as const, className: '' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sub.stores.name.toLowerCase().includes(searchLower) ||
      sub.stores.subdomain.toLowerCase().includes(searchLower) ||
      sub.stores.email.toLowerCase().includes(searchLower)
    );
  });

  const handleToggleModule = (subscription: Subscription, module: 'whatsapp' | 'delivery') => {
    setSelectedSubscription(subscription);
    setModuleType(module);
    setShowModuleDialog(true);
  };

  const confirmToggleModule = () => {
    if (!selectedSubscription || !moduleType) return;

    const currentlyEnabled = moduleType === 'whatsapp'
      ? selectedSubscription.whatsapp_enabled
      : selectedSubscription.delivery_enabled;

    toggleModuleMutation.mutate({
      subscriptionId: selectedSubscription.id,
      module: moduleType,
      enable: !currentlyEnabled,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Suscripciones</h1>
        <p className="text-muted-foreground mt-2">
          Administra todas las suscripciones y módulos de las tiendas
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por tienda, subdominio o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="pending_payment">Pago Pendiente</SelectItem>
                <SelectItem value="past_due">Vencida</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="suspended">Suspendida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Suscripciones ({filteredSubscriptions?.length || 0})</CardTitle>
          <CardDescription>
            Lista de todas las suscripciones en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!filteredSubscriptions || filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron suscripciones
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((subscription) => (
                <Card key={subscription.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Store className="h-4 w-4" />
                              {subscription.stores.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {subscription.stores.subdomain}.pideai.com
                            </p>
                            <p className="text-xs text-muted-foreground">{subscription.stores.email}</p>
                          </div>
                          {getStatusBadge(subscription.status)}
                        </div>

                        <div className="pt-2">
                          <Badge variant="secondary">{subscription.subscription_plans.display_name}</Badge>
                          <span className="text-sm text-muted-foreground ml-2">
                            ${subscription.subscription_plans.price_monthly}/mes
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Período actual</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(subscription.current_period_start), 'dd MMM', { locale: es })} -{' '}
                            {format(new Date(subscription.current_period_end), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>

                        {subscription.status === 'trial' && subscription.trial_ends_at && (
                          <div>
                            <p className="text-muted-foreground">Trial termina</p>
                            <p className="font-medium text-orange-600">
                              {format(new Date(subscription.trial_ends_at), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                        )}

                        <div className="pt-2">
                          <p className="text-muted-foreground mb-1">Módulos</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={subscription.whatsapp_enabled ? 'default' : 'outline'}
                              onClick={() => handleToggleModule(subscription, 'whatsapp')}
                            >
                              WhatsApp {subscription.whatsapp_enabled && '✓'}
                            </Button>
                            <Button
                              size="sm"
                              variant={subscription.delivery_enabled ? 'default' : 'outline'}
                              onClick={() => handleToggleModule(subscription, 'delivery')}
                            >
                              Delivery {subscription.delivery_enabled && '✓'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Toggle Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moduleType === 'whatsapp'
                ? selectedSubscription?.whatsapp_enabled ? 'Deshabilitar WhatsApp' : 'Habilitar WhatsApp'
                : selectedSubscription?.delivery_enabled ? 'Deshabilitar Delivery' : 'Habilitar Delivery'
              }
            </DialogTitle>
            <DialogDescription>
              Confirma que deseas{' '}
              {moduleType === 'whatsapp'
                ? selectedSubscription?.whatsapp_enabled ? 'deshabilitar' : 'habilitar'
                : selectedSubscription?.delivery_enabled ? 'deshabilitar' : 'habilitar'
              }{' '}
              el módulo {moduleType === 'whatsapp' ? 'WhatsApp' : 'Delivery'} para{' '}
              <strong>{selectedSubscription?.stores.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmToggleModule} disabled={toggleModuleMutation.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SubscriptionsManager;
