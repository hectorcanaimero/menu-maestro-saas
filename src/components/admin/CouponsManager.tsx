import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  useCouponUsages,
  type Coupon,
} from '@/hooks/useCoupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Ticket, Plus, Pencil, Trash2, Copy, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CouponsManager = () => {
  const { store } = useStore();
  const { data: coupons, isLoading } = useCoupons(store?.id);
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [viewingUsages, setViewingUsages] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minimum_order_amount: '0',
    maximum_discount: '',
    usage_limit: '',
    per_customer_limit: '1',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minimum_order_amount: '0',
      maximum_discount: '',
      usage_limit: '',
      per_customer_limit: '1',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value.toString(),
      minimum_order_amount: coupon.minimum_order_amount.toString(),
      maximum_discount: coupon.maximum_discount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      per_customer_limit: coupon.per_customer_limit.toString(),
      start_date: coupon.start_date ? format(new Date(coupon.start_date), 'yyyy-MM-dd') : '',
      end_date: coupon.end_date ? format(new Date(coupon.end_date), 'yyyy-MM-dd') : '',
      is_active: coupon.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    const couponData = {
      store_id: store.id,
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      value: parseFloat(formData.value),
      minimum_order_amount: parseFloat(formData.minimum_order_amount),
      maximum_discount: formData.maximum_discount ? parseFloat(formData.maximum_discount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      per_customer_limit: parseInt(formData.per_customer_limit),
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      is_active: formData.is_active,
    };

    if (editingCoupon) {
      await updateCoupon.mutateAsync({ id: editingCoupon.id, ...couponData });
    } else {
      await createCoupon.mutateAsync(couponData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!store?.id) return;
    await deleteCoupon.mutateAsync({ id, storeId: store.id });
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: 'Inactivo', variant: 'secondary' as const };
    
    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return { label: 'Programado', variant: 'default' as const };
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return { label: 'Expirado', variant: 'destructive' as const };
    }
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { label: 'Agotado', variant: 'destructive' as const };
    }
    return { label: 'Activo', variant: 'default' as const };
  };

  if (isLoading) {
    return <div className="p-6">Cargando cupones...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cupones</h1>
          <p className="text-muted-foreground">Gestiona los cupones de descuento de tu tienda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cupón
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Editar Cupón' : 'Crear Cupón'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="code">Código del Cupón *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="VERANO2024"
                      required
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Generar
                    </Button>
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="name">Nombre del Cupón *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Descuento de Verano"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción opcional del cupón"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Descuento *</Label>
                  <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value as 'percentage' | 'fixed_amount' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="value">Valor del Descuento *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="minimum_order_amount">Pedido Mínimo</Label>
                  <Input
                    id="minimum_order_amount"
                    type="number"
                    step="0.01"
                    value={formData.minimum_order_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_order_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                {formData.type === 'percentage' && (
                  <div>
                    <Label htmlFor="maximum_discount">Descuento Máximo</Label>
                    <Input
                      id="maximum_discount"
                      type="number"
                      step="0.01"
                      value={formData.maximum_discount}
                      onChange={(e) => setFormData({ ...formData, maximum_discount: e.target.value })}
                      placeholder="Sin límite"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="usage_limit">Límite de Usos Totales</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>

                <div>
                  <Label htmlFor="per_customer_limit">Usos por Cliente</Label>
                  <Input
                    id="per_customer_limit"
                    type="number"
                    value={formData.per_customer_limit}
                    onChange={(e) => setFormData({ ...formData, per_customer_limit: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Fecha de Fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Cupón Activo</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCoupon ? 'Actualizar' : 'Crear'} Cupón
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coupons?.map((coupon) => {
          const status = getCouponStatus(coupon);
          return (
            <Card key={coupon.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{coupon.name}</CardTitle>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <code className="font-mono font-bold text-lg">{coupon.code}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(coupon.code)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {coupon.description && (
                  <p className="text-sm text-muted-foreground">{coupon.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descuento:</span>
                    <span className="font-medium">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                    </span>
                  </div>

                  {coupon.minimum_order_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pedido mínimo:</span>
                      <span>${coupon.minimum_order_amount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Usos:
                    </span>
                    <span>
                      {coupon.usage_count}
                      {coupon.usage_limit ? `/${coupon.usage_limit}` : ''}
                    </span>
                  </div>

                  {(coupon.start_date || coupon.end_date) && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">
                        {coupon.start_date && format(new Date(coupon.start_date), 'dd/MM/yyyy')}
                        {coupon.start_date && coupon.end_date && ' - '}
                        {coupon.end_date && format(new Date(coupon.end_date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)} className="flex-1">
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cupón?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El cupón "{coupon.code}" será eliminado permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(coupon.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!coupons || coupons.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No hay cupones creados</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crea tu primer cupón de descuento para atraer más clientes
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Cupón
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CouponsManager;
