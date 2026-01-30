import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

interface ProductExtra {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean | null;
  display_order: number | null;
}

interface ProductExtrasManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItemId: string;
  menuItemName: string;
}

export const ProductExtrasManager = ({ open, onOpenChange, menuItemId, menuItemName }: ProductExtrasManagerProps) => {
  const [extras, setExtras] = useState<ProductExtra[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<ProductExtra | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_available: true,
  });

  useEffect(() => {
    if (open) {
      fetchExtras();
    }
  }, [open, menuItemId]);

  const fetchExtras = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_extras')
        .select('*')
        .eq('menu_item_id', menuItemId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setExtras(data || []);
    } catch (error) {
      toast.error('Error al cargar extras');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const extraData = {
        menu_item_id: menuItemId,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        is_available: formData.is_available,
        display_order: editingExtra?.display_order || extras.length,
      };

      if (editingExtra) {
        const { error } = await supabase.from('product_extras').update(extraData).eq('id', editingExtra.id);

        if (error) throw error;
        toast.success('Extra actualizado');
      } else {
        const { error } = await supabase.from('product_extras').insert([extraData]);

        if (error) throw error;
        toast.success('Extra creado');
      }

      setEditDialogOpen(false);
      resetForm();
      fetchExtras();
    } catch (error) {
      toast.error('Error al guardar extra');
    }
  };

  const handleEdit = (extra: ProductExtra) => {
    setEditingExtra(extra);
    setFormData({
      name: extra.name,
      description: extra.description || '',
      price: extra.price.toString(),
      is_available: extra.is_available ?? true,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este extra?')) return;

    try {
      const { error } = await supabase.from('product_extras').delete().eq('id', id);

      if (error) throw error;
      toast.success('Extra eliminado');
      fetchExtras();
    } catch (error) {
      toast.error('Error al eliminar extra');
    }
  };

  const handleToggleAvailability = async (extra: ProductExtra) => {
    try {
      const { error } = await supabase
        .from('product_extras')
        .update({ is_available: !extra.is_available })
        .eq('id', extra.id);

      if (error) throw error;

      setExtras(extras.map(e =>
        e.id === extra.id ? { ...e, is_available: !e.is_available } : e
      ));
      toast.success(extra.is_available ? 'Extra deshabilitado' : 'Extra habilitado');
    } catch (error) {
      toast.error('Error al cambiar disponibilidad');
    }
  };

  const handleReorder = async (extraId: string, direction: 'up' | 'down') => {
    const currentIndex = extras.findIndex((e) => e.id === extraId);
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === extras.length - 1)) {
      return;
    }

    const newExtras = [...extras];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Swap
    [newExtras[currentIndex], newExtras[targetIndex]] = [newExtras[targetIndex], newExtras[currentIndex]];

    // Update display_order for both
    const updates = newExtras.map((extra, index) => ({
      id: extra.id,
      display_order: index,
    }));

    try {
      // Update all display orders
      for (const update of updates) {
        await supabase.from('product_extras').update({ display_order: update.display_order }).eq('id', update.id);
      }

      setExtras(newExtras);
      toast.success('Orden actualizado');
    } catch (error) {
      toast.error('Error al reordenar');
      fetchExtras(); // Reload on error
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      is_available: true,
    });
    setEditingExtra(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Extras - {menuItemName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={() => {
                resetForm();
                setEditDialogOpen(true);
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Extra
            </Button>

            {loading ? (
              <div className="text-center py-8">Cargando extras...</div>
            ) : extras.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay extras. Crea uno para empezar.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Orden</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extras.map((extra, index) => (
                    <TableRow key={extra.id} className={!extra.is_available ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReorder(extra.id, 'up')}
                            disabled={index === 0}
                          >
                            <GripVertical className="w-3 h-3 rotate-90" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReorder(extra.id, 'down')}
                            disabled={index === extras.length - 1}
                          >
                            <GripVertical className="w-3 h-3 -rotate-90" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{extra.name}</span>
                          {extra.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{extra.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${extra.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={extra.is_available ?? true}
                          onCheckedChange={() => handleToggleAvailability(extra)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(extra)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(extra.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExtra ? 'Editar Extra' : 'Nuevo Extra'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extra-name">Nombre del Extra</Label>
              <Input
                id="extra-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Extra queso, Salsa picante, etc."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra-description">Descripción (opcional)</Label>
              <Textarea
                id="extra-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe este extra para los clientes..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra-price">Precio Adicional</Label>
              <Input
                id="extra-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="extra-available">Disponible</Label>
              <Switch
                id="extra-available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
            </div>
            <Button type="submit" className="w-full">
              {editingExtra ? 'Actualizar' : 'Crear'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
