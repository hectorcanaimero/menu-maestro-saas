import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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
  const isMobile = useMediaQuery('(max-width: 768px)');
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

  // Truncate name for title
  const truncatedName = menuItemName.length > 20 ? menuItemName.substring(0, 20) + '...' : menuItemName;

  const ExtrasContent = () => (
    <div className="space-y-4">
      <Button
        onClick={() => {
          resetForm();
          setEditDialogOpen(true);
        }}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar Extra
      </Button>

      {loading ? (
        <div className="text-center py-8">Cargando extras...</div>
      ) : extras.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay extras. Crea uno para empezar.</div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Extras creados ({extras.length})</p>
          {extras.map((extra, index) => (
            <div
              key={extra.id}
              className={`p-4 border rounded-lg space-y-3 ${!extra.is_available ? 'opacity-50 bg-muted/50' : 'bg-background'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{extra.name}</p>
                  {extra.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{extra.description}</p>
                  )}
                  <p className="text-sm font-semibold text-primary mt-1">${extra.price.toFixed(2)}</p>
                </div>
                <Switch
                  checked={extra.is_available ?? true}
                  onCheckedChange={() => handleToggleAvailability(extra)}
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleReorder(extra.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleReorder(extra.id, 'down')}
                    disabled={index === extras.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(extra)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(extra.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const EditForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="extra-name">Nombre del Extra *</Label>
        <Input
          id="extra-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="ej. Pequeña, Pepperoni, Azul"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="extra-price">Precio</Label>
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
      <div className="space-y-2">
        <Label htmlFor="extra-description">Descripción (opcional)</Label>
        <Textarea
          id="extra-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Breve descripción del extra"
          rows={2}
        />
      </div>
      <div className="p-3 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="extra-available" className="font-medium">Disponible</Label>
            <p className="text-xs text-muted-foreground">Si está desactivado, no se mostrará a los clientes</p>
          </div>
          <Switch
            id="extra-available"
            checked={formData.is_available}
            onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
          />
        </div>
      </div>
      <Button type="submit" className="w-full">
        {editingExtra ? 'Actualizar Extra' : 'Agregar Extra'}
      </Button>
    </form>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
            <SheetHeader className="px-4 pt-4 pb-3 border-b">
              <SheetTitle className="text-left">Gestionar Extras: {truncatedName}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <ExtrasContent />
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[90vh] flex flex-col p-0">
            <SheetHeader className="px-4 pt-4 pb-3 border-b">
              <SheetTitle className="text-left">{editingExtra ? 'Editar Extra' : 'Nuevo Extra'}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <EditForm />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Extras: {truncatedName}</DialogTitle>
          </DialogHeader>
          <ExtrasContent />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExtra ? 'Editar Extra' : 'Nuevo Extra'}</DialogTitle>
          </DialogHeader>
          <EditForm />
        </DialogContent>
      </Dialog>
    </>
  );
};
