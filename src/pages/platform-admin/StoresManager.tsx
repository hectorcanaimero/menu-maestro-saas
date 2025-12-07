import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Store, Calendar, ExternalLink, Mail, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatSubdomainDisplay } from '@/lib/subdomain-validation';

interface StoreData {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  owner_id: string;
  subscriptions: Array<{
    status: string;
    subscription_plans: {
      display_name: string;
    };
  }>;
}

function StoresManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all stores
  const { data: stores, isLoading } = useQuery({
    queryKey: ['all-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          subscriptions (
            status,
            subscription_plans (display_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StoreData[];
    },
  });

  const filteredStores = stores?.filter((store) => {
    const matchesSearch = searchTerm.toLowerCase() === '' ||
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && store.is_active) ||
      (statusFilter === 'inactive' && !store.is_active);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-600">Activa</Badge>
    ) : (
      <Badge variant="outline">Inactiva</Badge>
    );
  };

  const getSubscriptionBadge = (subscription: StoreData['subscriptions'][0] | undefined) => {
    if (!subscription) {
      return <Badge variant="outline">Sin suscripción</Badge>;
    }

    const statusColors = {
      trial: 'border-blue-500 text-blue-700',
      active: 'bg-green-600',
      pending_payment: 'bg-yellow-600',
      past_due: 'bg-red-600',
      cancelled: 'bg-gray-600',
      suspended: 'bg-red-600',
    };

    return (
      <Badge
        variant={subscription.status === 'active' ? 'default' : 'outline'}
        className={statusColors[subscription.status as keyof typeof statusColors] || ''}
      >
        {subscription.subscription_plans.display_name}
      </Badge>
    );
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
        <h1 className="text-3xl font-bold">Gestión de Tiendas</h1>
        <p className="text-muted-foreground mt-2">
          Administra todas las tiendas registradas en la plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tiendas</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Store className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores?.filter((s) => s.is_active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Trial</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores?.filter((s) => s.subscriptions?.[0]?.status === 'trial').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
            <Store className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores?.filter((s) => s.subscriptions?.[0]?.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, subdominio o email..."
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
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stores List */}
      <Card>
        <CardHeader>
          <CardTitle>Tiendas ({filteredStores?.length || 0})</CardTitle>
          <CardDescription>
            Lista de todas las tiendas registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!filteredStores || filteredStores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron tiendas
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStores.map((store) => (
                <Card key={store.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Store className="h-4 w-4" />
                              {store.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <a
                                href={`https://${formatSubdomainDisplay(store.subdomain)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {formatSubdomainDisplay(store.subdomain)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                          {getStatusBadge(store.is_active)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {store.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {store.email}
                            </div>
                          )}
                          {store.phone && (
                            <div className="text-muted-foreground">
                              📞 {store.phone}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Registrada: {format(new Date(store.created_at), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Plan</p>
                          {getSubscriptionBadge(store.subscriptions?.[0])}
                        </div>

                        {store.subscriptions?.[0] && (
                          <div className="pt-2">
                            <Badge variant="outline" className="text-xs">
                              {store.subscriptions[0].status === 'trial' && 'En período de prueba'}
                              {store.subscriptions[0].status === 'active' && 'Suscripción activa'}
                              {store.subscriptions[0].status === 'pending_payment' && 'Pago pendiente'}
                              {store.subscriptions[0].status === 'past_due' && 'Pago vencido'}
                              {store.subscriptions[0].status === 'cancelled' && 'Cancelada'}
                              {store.subscriptions[0].status === 'suspended' && 'Suspendida'}
                            </Badge>
                          </div>
                        )}

                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://${formatSubdomainDisplay(store.subdomain)}`, '_blank')}
                            className="w-full gap-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visitar tienda
                          </Button>
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
    </div>
  );
}

export default StoresManager;
