import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import type {
  PaymentMethod,
  PaymentMethodType,
  PagoMovilDetails,
  ZelleDetails,
  BinanceDetails,
  OtrosDetails,
} from '@/types/payment-methods';
import { VENEZUELAN_BANKS } from '@/types/payment-methods';

interface PaymentMethodsManagerProps {
  storeId: string;
}

export function PaymentMethodsManager({ storeId }: PaymentMethodsManagerProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    is_active: boolean;
    payment_type: PaymentMethodType;
    payment_details: {
      // Pago Movil
      bank_code?: string;
      cedula?: string;
      phone?: string;
      // Zelle
      email?: string;
      holder_name?: string;
      // Binance
      key?: string;
      // Otros (uses name + description)
    };
  }>({
    name: '',
    description: '',
    is_active: true,
    payment_type: 'otros',
    payment_details: {},
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, [storeId]);

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      toast.error('Error al cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        description: method.description || '',
        is_active: method.is_active ?? true,
        payment_type: method.payment_type,
        payment_details: method.payment_details || {},
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        description: '',
        is_active: true,
        payment_type: 'otros',
        payment_details: {},
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    // Validate required fields based on payment type
    if (formData.payment_type === 'pago_movil') {
      if (!formData.payment_details.bank_code || !formData.payment_details.cedula || !formData.payment_details.phone) {
        toast.error('Pago Móvil requiere código de banco, cédula y teléfono');
        return;
      }
    } else if (formData.payment_type === 'zelle') {
      if (!formData.payment_details.email || !formData.payment_details.holder_name) {
        toast.error('Zelle requiere email y nombre del titular');
        return;
      }
    } else if (formData.payment_type === 'binance') {
      if (!formData.payment_details.key) {
        toast.error('Binance requiere la clave');
        return;
      }
    } else if (formData.payment_type === 'otros') {
      if (!formData.description.trim()) {
        toast.error('Otros requiere una descripción');
        return;
      }
    }

    // Build payment details based on type
    let payment_details = null;
    if (formData.payment_type === 'pago_movil') {
      payment_details = {
        bank_code: formData.payment_details.bank_code,
        cedula: formData.payment_details.cedula,
        phone: formData.payment_details.phone,
      };
    } else if (formData.payment_type === 'zelle') {
      payment_details = {
        email: formData.payment_details.email,
        holder_name: formData.payment_details.holder_name,
      };
    } else if (formData.payment_type === 'binance') {
      payment_details = {
        key: formData.payment_details.key,
      };
    } else if (formData.payment_type === 'otros') {
      payment_details = {
        name: formData.name,
        description: formData.description,
      };
    }

    setSaving(true);
    try {
      // Verify session before saving
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }

      if (editingMethod) {
        // Update existing method
        const { error } = await supabase
          .from('payment_methods')
          .update({
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
            payment_type: formData.payment_type,
            payment_details: payment_details,
          })
          .eq('id', editingMethod.id)
          .eq('store_id', storeId); // Add explicit store_id check for RLS

        if (error) {
          throw error;
        }
        toast.success('Método de pago actualizado');
      } else {
        // Create new method
        const { error } = await supabase.from('payment_methods').insert({
          store_id: storeId,
          name: formData.name,
          description: formData.description || null,
          is_active: formData.is_active,
          payment_type: formData.payment_type,
          payment_details: payment_details,
          display_order: methods.length,
        });

        if (error) {
          throw error;
        }
        toast.success('Método de pago creado');
      }

      setDialogOpen(false);
      loadPaymentMethods();
    } catch (error: any) {
      // Provide more specific error messages
      if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
        toast.error('Error de autenticación. Por favor, recarga la página e intenta nuevamente.');
      } else if (error?.message?.includes('permission') || error?.code === '42501') {
        toast.error('No tienes permisos para realizar esta acción.');
      } else {
        toast.error(`Error al guardar: ${error?.message || 'Error desconocido'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este método de pago?')) return;

    try {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);

      if (error) throw error;
      toast.success('Método de pago eliminado');
      loadPaymentMethods();
    } catch (error) {
      toast.error('Error al eliminar el método de pago');
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !method.is_active })
        .eq('id', method.id);

      if (error) throw error;
      loadPaymentMethods();
    } catch (error) {
      toast.error('Error al actualizar el método de pago');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Métodos de Pago</h3>
          <p className="text-sm text-muted-foreground">Administra los métodos de pago disponibles para tus clientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleOpenDialog();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Método
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}</DialogTitle>
              <DialogDescription>Configura la información del método de pago</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              {/* Payment Type Selection */}
              <div className="space-y-2">
                <Label>Tipo de Método de Pago *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={formData.payment_type === 'pago_movil' ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => setFormData({ ...formData, payment_type: 'pago_movil', payment_details: {} })}
                  >
                    Pago Móvil
                  </Button>
                  <Button
                    type="button"
                    variant={formData.payment_type === 'zelle' ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => setFormData({ ...formData, payment_type: 'zelle', payment_details: {} })}
                  >
                    Zelle
                  </Button>
                  <Button
                    type="button"
                    variant={formData.payment_type === 'binance' ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => setFormData({ ...formData, payment_type: 'binance', payment_details: {} })}
                  >
                    Binance
                  </Button>
                  <Button
                    type="button"
                    variant={formData.payment_type === 'otros' ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => setFormData({ ...formData, payment_type: 'otros', payment_details: {} })}
                  >
                    Otros
                  </Button>
                </div>
              </div>

              {/* Common Fields */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Pago Móvil Banesco, Mi Zelle, etc."
                  maxLength={100}
                />
              </div>

              {/* Pago Movil Fields */}
              {formData.payment_type === 'pago_movil' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bank_code">Banco *</Label>
                    <Select
                      value={formData.payment_details.bank_code}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          payment_details: { ...formData.payment_details, bank_code: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {VENEZUELAN_BANKS.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.code} - {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula *</Label>
                    <Input
                      id="cedula"
                      value={formData.payment_details.cedula || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_details: { ...formData.payment_details, cedula: e.target.value },
                        })
                      }
                      placeholder="12345678"
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.payment_details.phone || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_details: { ...formData.payment_details, phone: e.target.value },
                        })
                      }
                      placeholder="04121234567"
                      maxLength={20}
                    />
                  </div>
                </>
              )}

              {/* Zelle Fields */}
              {formData.payment_type === 'zelle' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.payment_details.email || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_details: { ...formData.payment_details, email: e.target.value },
                        })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="holder_name">Nombre del Titular *</Label>
                    <Input
                      id="holder_name"
                      value={formData.payment_details.holder_name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_details: { ...formData.payment_details, holder_name: e.target.value },
                        })
                      }
                      placeholder="Juan Pérez"
                      maxLength={100}
                    />
                  </div>
                </>
              )}

              {/* Binance Fields */}
              {formData.payment_type === 'binance' && (
                <div className="space-y-2">
                  <Label htmlFor="key">Clave / ID *</Label>
                  <Input
                    id="key"
                    value={formData.payment_details.key || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_details: { ...formData.payment_details, key: e.target.value },
                      })
                    }
                    placeholder="Tu ID de Binance"
                    maxLength={100}
                  />
                </div>
              )}

              {/* Otros Fields */}
              {formData.payment_type === 'otros' && (
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción / Instrucciones *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: Transferir a la cuenta 0123-4567-8901. Banco Ejemplo."
                    rows={4}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Método activo</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingMethod ? 'Guardar Cambios' : 'Crear Método'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {methods.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">No hay métodos de pago configurados</p>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleOpenDialog();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Primer Método
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-muted-foreground truncate">{method.description || '-'}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={method.is_active ?? false} onCheckedChange={() => handleToggleActive(method)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenDialog(method);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(method.id);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
