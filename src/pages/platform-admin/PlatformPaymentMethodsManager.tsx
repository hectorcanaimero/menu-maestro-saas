/**
 * Platform Payment Methods Manager
 *
 * Manages payment methods for PideAI platform subscriptions
 * Only accessible by platform admins
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import type {
  PaymentMethod,
  PagoMovilDetails,
  ZelleDetails,
  BinanceDetails,
  OtrosDetails,
} from '@/types/payment-methods';

type PaymentMethodType = 'pago_movil' | 'zelle' | 'binance' | 'otros';

interface FormData {
  name: string;
  description: string;
  payment_type: PaymentMethodType;
  is_active: boolean;
  display_order: number;
  // Type-specific fields
  bank_code?: string;
  cedula?: string;
  phone?: string;
  email?: string;
  holder_name?: string;
  key?: string;
  otros_name?: string;
  otros_description?: string;
}

export default function PlatformPaymentMethodsManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    payment_type: 'pago_movil',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_payment_methods')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMethods((data as PaymentMethod[]) || []);
    } catch (error: any) {
      toast.error('Error al cargar métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      payment_type: 'pago_movil',
      is_active: true,
      display_order: 0,
    });
    setEditingMethod(null);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
      payment_type: method.payment_type,
      is_active: method.is_active,
      display_order: method.display_order || 0,
      // Load type-specific fields
      ...(method.payment_type === 'pago_movil' && method.payment_details
        ? {
            bank_code: (method.payment_details as PagoMovilDetails).bank_code,
            cedula: (method.payment_details as PagoMovilDetails).cedula,
            phone: (method.payment_details as PagoMovilDetails).phone,
          }
        : {}),
      ...(method.payment_type === 'zelle' && method.payment_details
        ? {
            email: (method.payment_details as ZelleDetails).email,
            holder_name: (method.payment_details as ZelleDetails).holder_name,
          }
        : {}),
      ...(method.payment_type === 'binance' && method.payment_details
        ? {
            key: (method.payment_details as BinanceDetails).key,
          }
        : {}),
      ...(method.payment_type === 'otros' && method.payment_details
        ? {
            otros_name: (method.payment_details as OtrosDetails).name,
            otros_description: (method.payment_details as OtrosDetails).description,
          }
        : {}),
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    // Build payment_details based on type
    let payment_details: any = null;

    if (formData.payment_type === 'pago_movil') {
      if (!formData.bank_code || !formData.cedula || !formData.phone) {
        toast.error('Todos los campos de Pago Móvil son requeridos');
        return;
      }
      payment_details = {
        bank_code: formData.bank_code,
        cedula: formData.cedula,
        phone: formData.phone,
      };
    } else if (formData.payment_type === 'zelle') {
      if (!formData.email || !formData.holder_name) {
        toast.error('Todos los campos de Zelle son requeridos');
        return;
      }
      payment_details = {
        email: formData.email,
        holder_name: formData.holder_name,
      };
    } else if (formData.payment_type === 'binance') {
      if (!formData.key) {
        toast.error('El Binance Pay ID es requerido');
        return;
      }
      payment_details = {
        key: formData.key,
      };
    } else if (formData.payment_type === 'otros') {
      payment_details = {
        name: formData.otros_name || '',
        description: formData.otros_description || '',
      };
    }

    setSubmitting(true);
    try {
      if (editingMethod) {
        // Update
        const { error } = await supabase
          .from('platform_payment_methods')
          .update({
            name: formData.name,
            description: formData.description || null,
            payment_type: formData.payment_type,
            payment_details,
            is_active: formData.is_active,
            display_order: formData.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMethod.id);

        if (error) throw error;
        toast.success('Método de pago actualizado');
      } else {
        // Create
        const { error } = await supabase.from('platform_payment_methods').insert({
          name: formData.name,
          description: formData.description || null,
          payment_type: formData.payment_type,
          payment_details,
          is_active: formData.is_active,
          display_order: formData.display_order,
        });

        if (error) throw error;
        toast.success('Método de pago creado');
      }

      setShowDialog(false);
      resetForm();
      loadMethods();
    } catch (error: any) {
      toast.error('Error al guardar método de pago');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este método de pago?')) return;

    try {
      const { error } = await supabase.from('platform_payment_methods').delete().eq('id', id);

      if (error) throw error;
      toast.success('Método de pago eliminado');
      loadMethods();
    } catch (error: any) {
      toast.error('Error al eliminar método de pago');
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('platform_payment_methods')
        .update({ is_active: !method.is_active })
        .eq('id', method.id);

      if (error) throw error;
      toast.success(method.is_active ? 'Método desactivado' : 'Método activado');
      loadMethods();
    } catch (error: any) {
      toast.error('Error al cambiar estado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Métodos de Pago de la Plataforma</h2>
          <p className="text-muted-foreground">Configura los métodos de pago para suscripciones de PideAI</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Método
        </Button>
      </div>

      <div className="grid gap-4">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{method.name}</CardTitle>
                    <Badge variant={method.is_active ? 'default' : 'secondary'}>
                      {method.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge variant="outline">{method.payment_type}</Badge>
                  </div>
                  {method.description && <CardDescription className="mt-1">{method.description}</CardDescription>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(method)}>
                    {method.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(method)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(method.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {method.payment_details && (
              <CardContent>
                <div className="text-sm space-y-1">
                  {method.payment_type === 'pago_movil' && (
                    <>
                      <p>
                        <span className="text-muted-foreground">Banco:</span>{' '}
                        {(method.payment_details as PagoMovilDetails).bank_code}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Cédula:</span>{' '}
                        {(method.payment_details as PagoMovilDetails).cedula}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Teléfono:</span>{' '}
                        {(method.payment_details as PagoMovilDetails).phone}
                      </p>
                    </>
                  )}
                  {method.payment_type === 'zelle' && (
                    <>
                      <p>
                        <span className="text-muted-foreground">Email:</span>{' '}
                        {(method.payment_details as ZelleDetails).email}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Titular:</span>{' '}
                        {(method.payment_details as ZelleDetails).holder_name}
                      </p>
                    </>
                  )}
                  {method.payment_type === 'binance' && (
                    <p>
                      <span className="text-muted-foreground">Binance Pay ID:</span>{' '}
                      {(method.payment_details as BinanceDetails).key}
                    </p>
                  )}
                  {method.payment_type === 'otros' && (
                    <>
                      {(method.payment_details as OtrosDetails).name && (
                        <p>
                          <span className="text-muted-foreground">Nombre:</span>{' '}
                          {(method.payment_details as OtrosDetails).name}
                        </p>
                      )}
                      {(method.payment_details as OtrosDetails).description && (
                        <p>
                          <span className="text-muted-foreground">Descripción:</span>{' '}
                          {(method.payment_details as OtrosDetails).description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {methods.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay métodos de pago configurados
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}</DialogTitle>
            <DialogDescription>Configura un método de pago para suscripciones de PideAI</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Pago Móvil"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del método de pago"
                rows={2}
              />
            </div>

            {/* Payment Type */}
            <div>
              <Label htmlFor="payment_type">Tipo de Pago *</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value) => setFormData({ ...formData, payment_type: value as PaymentMethodType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="binance">Binance Pay</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type-specific fields */}
            {formData.payment_type === 'pago_movil' && (
              <>
                <div>
                  <Label htmlFor="bank_code">Código del Banco *</Label>
                  <Input
                    id="bank_code"
                    value={formData.bank_code || ''}
                    onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                    placeholder="Ej: 0102"
                  />
                </div>
                <div>
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula || ''}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    placeholder="Ej: V12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej: 04121234567"
                  />
                </div>
              </>
            )}

            {formData.payment_type === 'zelle' && (
              <>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ej: pagos@pideai.com"
                  />
                </div>
                <div>
                  <Label htmlFor="holder_name">Nombre del Titular *</Label>
                  <Input
                    id="holder_name"
                    value={formData.holder_name || ''}
                    onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                    placeholder="Ej: PideAI LLC"
                  />
                </div>
              </>
            )}

            {formData.payment_type === 'binance' && (
              <div>
                <Label htmlFor="key">Binance Pay ID *</Label>
                <Input
                  id="key"
                  value={formData.key || ''}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="Ej: 123456789"
                />
              </div>
            )}

            {formData.payment_type === 'otros' && (
              <>
                <div>
                  <Label htmlFor="otros_name">Nombre</Label>
                  <Input
                    id="otros_name"
                    value={formData.otros_name || ''}
                    onChange={(e) => setFormData({ ...formData, otros_name: e.target.value })}
                    placeholder="Nombre del método"
                  />
                </div>
                <div>
                  <Label htmlFor="otros_description">Descripción</Label>
                  <Textarea
                    id="otros_description"
                    value={formData.otros_description || ''}
                    onChange={(e) => setFormData({ ...formData, otros_description: e.target.value })}
                    placeholder="Instrucciones de pago..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Display Order */}
            <div>
              <Label htmlFor="display_order">Orden de Visualización</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Método activo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
