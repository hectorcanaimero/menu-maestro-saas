import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, UserPlus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Admin {
  id: string;
  user_id: string;
  role: 'super_admin' | 'support' | 'billing';
  created_at: string;
  created_by: string | null;
}

type AdminRole = 'super_admin' | 'support' | 'billing';

function AdminsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'support' as AdminRole,
  });

  // Fetch admins
  const { data: admins, isLoading } = useQuery({
    queryKey: ['platform-admins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Admin[];
    },
  });

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AdminRole }) => {
      // First, get the user_id from the email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        throw new Error('Usuario no encontrado con ese email');
      }

      // Check if already admin
      const { data: existingAdmin } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (existingAdmin) {
        throw new Error('Este usuario ya es administrador');
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create admin
      const { data, error } = await supabase
        .from('platform_admins')
        .insert({
          user_id: userData.id,
          role: role,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Administrador agregado',
        description: 'El nuevo administrador ha sido creado correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
      setShowAddDialog(false);
      setFormData({ email: '', role: 'support' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al agregar administrador',
        description: error.message,
      });
    },
  });

  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase.from('platform_admins').delete().eq('id', adminId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Administrador eliminado',
        description: 'El administrador ha sido removido del sistema',
      });
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
      setShowDeleteDialog(false);
      setSelectedAdmin(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar administrador',
        description: error.message,
      });
    },
  });

  const handleAdd = () => {
    if (!formData.email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ingresa un email válido',
      });
      return;
    }

    addAdminMutation.mutate(formData);
  };

  const handleDelete = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedAdmin) return;
    deleteAdminMutation.mutate(selectedAdmin.id);
  };

  const getRoleBadge = (role: AdminRole) => {
    const roleConfig = {
      super_admin: { label: 'Super Admin', className: 'bg-purple-600' },
      support: { label: 'Soporte', className: 'bg-blue-600' },
      billing: { label: 'Facturación', className: 'bg-green-600' },
    };

    const config = roleConfig[role];
    return <Badge className={config.className}>{config.label}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Administradores</h1>
          <p className="text-muted-foreground mt-2">
            Administra los usuarios con acceso al panel de plataforma (solo super admin)
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Agregar Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins?.filter((a) => a.role === 'super_admin').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soporte</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins?.filter((a) => a.role === 'support').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle>Administradores de Plataforma</CardTitle>
          <CardDescription>Lista de usuarios con acceso administrativo</CardDescription>
        </CardHeader>
        <CardContent>
          {!admins || admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay administradores registrados
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <Card key={admin.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Shield className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">User ID: {admin.user_id.slice(0, 8)}...</p>
                            {getRoleBadge(admin.role)}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Agregado: {format(new Date(admin.created_at), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>

                      {admin.role !== 'super_admin' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(admin)}
                          className="gap-2"
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Roles de Administrador</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>
            <strong className="text-purple-600">Super Admin:</strong> Acceso completo a todas las
            funcionalidades, incluyendo gestión de planes y otros admins.
          </div>
          <div>
            <strong className="text-blue-600">Soporte:</strong> Puede ver tiendas, suscripciones y validar
            pagos.
          </div>
          <div>
            <strong className="text-green-600">Facturación:</strong> Especializado en validación de pagos y
            gestión de suscripciones.
          </div>
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Administrador</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario con acceso al panel de administración de plataforma
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email del usuario *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El usuario debe estar registrado en el sistema
              </p>
            </div>

            <div>
              <Label htmlFor="role">Rol *</Label>
              <Select value={formData.role} onValueChange={(value: AdminRole) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin (acceso completo)</SelectItem>
                  <SelectItem value="support">Soporte (ver y validar)</SelectItem>
                  <SelectItem value="billing">Facturación (pagos y suscripciones)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setFormData({ email: '', role: 'support' });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={addAdminMutation.isPending}>
              {addAdminMutation.isPending ? 'Agregando...' : 'Agregar Administrador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este administrador? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteAdminMutation.isPending}
            >
              {deleteAdminMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminsManager;
