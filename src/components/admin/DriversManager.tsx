import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Bike, 
  Car, 
  FootprintsIcon,
  Edit,
  Trash2,
  MapPin,
  CircleDot
} from 'lucide-react';
import { useDrivers, Driver, CreateDriverInput } from '@/hooks/useDrivers';
import { H3, Body, Caption } from '@/components/ui/typography';

const vehicleIcons: Record<string, React.ReactNode> = {
  motorcycle: <Bike className="w-4 h-4" />,
  bicycle: <Bike className="w-4 h-4" />,
  car: <Car className="w-4 h-4" />,
  walking: <FootprintsIcon className="w-4 h-4" />,
};

const statusColors: Record<string, string> = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  busy: 'Ocupado',
  offline: 'Desconectado',
};

export function DriversManager() {
  const { drivers, isLoading, createDriver, updateDriver, deleteDriver } = useDrivers();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [formData, setFormData] = useState<CreateDriverInput>({
    name: '',
    phone: '',
    email: '',
    vehicle_type: 'motorcycle',
    license_plate: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      vehicle_type: 'motorcycle',
      license_plate: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.phone) return;

    await createDriver.mutateAsync(formData);
    resetForm();
    setIsCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingDriver) return;

    await updateDriver.mutateAsync({
      id: editingDriver.id,
      ...formData,
    });
    setEditingDriver(null);
    resetForm();
  };

  const handleDelete = async (driver: Driver) => {
    await deleteDriver.mutateAsync(driver.id);
  };

  const handleToggleActive = async (driver: Driver) => {
    await updateDriver.mutateAsync({
      id: driver.id,
      is_active: !driver.is_active,
    });
  };

  const handleStatusChange = async (driver: Driver, status: 'available' | 'busy' | 'offline') => {
    await updateDriver.mutateAsync({
      id: driver.id,
      status,
    });
  };

  const openEditDialog = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || '',
      vehicle_type: driver.vehicle_type,
      license_plate: driver.license_plate || '',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <H3>Motoristas</H3>
          <Caption className="text-muted-foreground">
            Gestiona tu flota de repartidores
          </Caption>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Motorista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Motorista</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+58 412 1234567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Vehículo</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorcycle">Moto</SelectItem>
                    <SelectItem value="bicycle">Bicicleta</SelectItem>
                    <SelectItem value="car">Auto</SelectItem>
                    <SelectItem value="walking">A pie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Placa</Label>
                <Input
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  placeholder="ABC123"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreate}
                disabled={!formData.name || !formData.phone || createDriver.isPending}
              >
                {createDriver.isPending ? 'Creando...' : 'Crear Motorista'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {drivers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <Body>No hay motoristas registrados</Body>
            <Caption className="text-muted-foreground">
              Agrega motoristas para gestionar tus entregas
            </Caption>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <Card key={driver.id} className={!driver.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {driver.photo_url ? (
                        <img src={driver.photo_url} alt={driver.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{driver.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${statusColors[driver.status]}`} />
                        <Caption className="text-muted-foreground">
                          {statusLabels[driver.status]}
                        </Caption>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={driver.is_active}
                    onCheckedChange={() => handleToggleActive(driver)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{driver.phone}</span>
                </div>
                {driver.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{driver.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {vehicleIcons[driver.vehicle_type]}
                  <span className="capitalize">{driver.vehicle_type}</span>
                  {driver.license_plate && (
                    <Badge variant="outline" className="ml-2">{driver.license_plate}</Badge>
                  )}
                </div>
                {driver.current_lat && driver.current_lng && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <MapPin className="w-4 h-4" />
                    <span>Ubicación activa</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Select
                    value={driver.status}
                    onValueChange={(v) => handleStatusChange(driver, v as any)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="busy">Ocupado</SelectItem>
                      <SelectItem value="offline">Desconectado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(driver)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar motorista?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente a {driver.name}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(driver)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDriver} onOpenChange={(open) => !open && setEditingDriver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Motorista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Vehículo</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="motorcycle">Moto</SelectItem>
                  <SelectItem value="bicycle">Bicicleta</SelectItem>
                  <SelectItem value="car">Auto</SelectItem>
                  <SelectItem value="walking">A pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Placa</Label>
              <Input
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleUpdate}
              disabled={!formData.name || !formData.phone || updateDriver.isPending}
            >
              {updateDriver.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}