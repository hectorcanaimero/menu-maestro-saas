import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  product_ids: string[] | null;
  category_ids: string[] | null;
  created_at: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
}

const PromotionsManager = () => {
  const { store } = useStore();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    start_date: '',
    end_date: '',
    is_active: true,
    product_ids: [] as string[],
    category_ids: [] as string[],
  });

  useEffect(() => {
    if (store?.id) {
      fetchPromotions();
      fetchCategories();
      fetchMenuItems();
    }
  }, [store?.id]);

  const fetchPromotions = async () => {
    if (!store?.id) return;

    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions((data || []) as Promotion[]);
    } catch (error) {
      toast.error('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!store?.id) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', store.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      throw new Error(error as string | undefined);
    }
  };

  const fetchMenuItems = async () => {
    if (!store?.id) return;

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('store_id', store.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      throw new Error(error as string | undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!store?.id) {
      toast.error('No se pudo identificar la tienda');
      return;
    }

    // Validation
    if (formData.type === 'percentage' && formData.value > 100) {
      toast.error('El descuento porcentual no puede ser mayor a 100%');
      return;
    }

    if (formData.value <= 0) {
      toast.error('El valor del descuento debe ser mayor a 0');
      return;
    }

    try {
      const promotionData = {
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        value: formData.value,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        product_ids: formData.product_ids.length > 0 ? formData.product_ids : null,
        category_ids: formData.category_ids.length > 0 ? formData.category_ids : null,
      };

      if (editingPromotion) {
        const { error } = await supabase.from('promotions').update(promotionData).eq('id', editingPromotion.id);

        if (error) throw error;
        toast.success('Promoción actualizada');
      } else {
        const { error } = await supabase.from('promotions').insert([
          {
            ...promotionData,
            store_id: store.id,
          },
        ]);

        if (error) throw error;
        toast.success('Promoción creada');
      }

      fetchPromotions();
      handleCloseDialog();
    } catch (error) {
      toast.error('Error al guardar la promoción');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;

    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id);

      if (error) throw error;
      toast.success('Promoción eliminada');
      fetchPromotions();
    } catch (error) {
      toast.error('Error al eliminar la promoción');
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      value: promotion.value,
      start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
      end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
      is_active: promotion.is_active ?? true,
      product_ids: promotion.product_ids || [],
      category_ids: promotion.category_ids || [],
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPromotion(null);
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      start_date: '',
      end_date: '',
      is_active: true,
      product_ids: [],
      category_ids: [],
    });
  };

  const getPromotionBadge = (promotion: Promotion) => {
    const now = new Date();
    const startDate = promotion.start_date ? new Date(promotion.start_date) : null;
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;

    if (!promotion.is_active) {
      return <Badge variant="secondary">Inactiva</Badge>;
    }

    if (startDate && startDate > now) {
      return <Badge variant="outline">Programada</Badge>;
    }

    if (endDate && endDate < now) {
      return <Badge variant="destructive">Expirada</Badge>;
    }

    return <Badge variant="default">Activa</Badge>;
  };

  const getPromotionScope = (promotion: Promotion) => {
    if (promotion.product_ids && promotion.product_ids.length > 0) {
      return `${promotion.product_ids.length} producto(s)`;
    }
    if (promotion.category_ids && promotion.category_ids.length > 0) {
      return `${promotion.category_ids.length} categoría(s)`;
    }
    return 'Toda la tienda';
  };

  if (loading) {
    return <div className="p-6">Cargando promociones...</div>;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
            Gestión de Promociones
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleCloseDialog()} className="w-full sm:w-auto text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Nueva Promoción
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl h-[95vh] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">
                  {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-4">
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name" className="text-xs sm:text-sm">
                      Nombre de la promoción
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Descuento de Verano"
                      className="text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description" className="text-xs sm:text-sm">
                      Descripción (opcional)
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción de la promoción"
                      className="text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-xs sm:text-sm">
                      Tipo de descuento
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                        <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value" className="text-xs sm:text-sm">
                      Valor {formData.type === 'percentage' ? '(%)' : '($)'}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step={formData.type === 'percentage' ? '1' : '0.01'}
                      min="0"
                      max={formData.type === 'percentage' ? '100' : undefined}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      className="text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-xs sm:text-sm">
                      Fecha de inicio (opcional)
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-xs sm:text-sm">
                      Fecha de fin (opcional)
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2 sm:col-span-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active" className="cursor-pointer text-xs sm:text-sm">
                      Promoción activa
                    </Label>
                  </div>
                </div>

                <div className="border-t pt-3 sm:pt-4">
                  <h4 className="font-medium mb-3 text-sm sm:text-base">Alcance de la promoción</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    Si no seleccionas productos o categorías, la promoción se aplicará a toda la tienda.
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Productos específicos</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                        {menuItems.map((item) => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`product-${item.id}`}
                              checked={formData.product_ids.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    product_ids: [...formData.product_ids, item.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    product_ids: formData.product_ids.filter((id) => id !== item.id),
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`product-${item.id}`} className="text-xs sm:text-sm cursor-pointer">
                              {item.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Categorías</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`category-${category.id}`}
                              checked={formData.category_ids.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    category_ids: [...formData.category_ids, category.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    category_ids: formData.category_ids.filter((id) => id !== category.id),
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`category-${category.id}`} className="text-xs sm:text-sm cursor-pointer">
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog} className="text-sm">
                    Cancelar
                  </Button>
                  <Button type="submit" className="text-sm">
                    {editingPromotion ? 'Guardar Cambios' : 'Crear Promoción'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {promotions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Tag className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm sm:text-base text-muted-foreground">No hay promociones creadas</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Crea tu primera promoción para atraer más clientes
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs">Descuento</TableHead>
                      <TableHead className="text-xs">Alcance</TableHead>
                      <TableHead className="text-xs">Periodo</TableHead>
                      <TableHead className="text-xs">Estado</TableHead>
                      <TableHead className="text-right text-xs">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promotion) => (
                      <TableRow key={promotion.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{promotion.name}</div>
                            {promotion.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">{promotion.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {promotion.type === 'percentage' ? `${promotion.value}%` : `$${promotion.value.toFixed(2)}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{getPromotionScope(promotion)}</TableCell>
                        <TableCell className="text-xs">
                          {promotion.start_date || promotion.end_date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {promotion.start_date ? format(new Date(promotion.start_date), 'dd/MM/yy') : '∞'}
                                {' - '}
                                {promotion.end_date ? format(new Date(promotion.end_date), 'dd/MM/yy') : '∞'}
                              </span>
                            </div>
                          ) : (
                            'Sin límite'
                          )}
                        </TableCell>
                        <TableCell>{getPromotionBadge(promotion)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(promotion)}
                              aria-label="Editar promoción"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(promotion.id)}
                              aria-label="Eliminar promoción"
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

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {promotions.map((promotion) => (
                  <Card key={promotion.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{promotion.name}</h3>
                          {promotion.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{promotion.description}</p>
                          )}
                        </div>
                        {getPromotionBadge(promotion)}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {promotion.type === 'percentage' ? `${promotion.value}%` : `$${promotion.value.toFixed(2)}`}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{getPromotionScope(promotion)}</span>
                      </div>

                      {(promotion.start_date || promotion.end_date) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {promotion.start_date ? format(new Date(promotion.start_date), 'dd/MM/yy') : '∞'}
                            {' - '}
                            {promotion.end_date ? format(new Date(promotion.end_date), 'dd/MM/yy') : '∞'}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(promotion)}
                          className="flex-1 text-xs"
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(promotion.id)}
                          className="flex-1 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionsManager;
