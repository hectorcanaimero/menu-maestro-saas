import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface QuickEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  field: 'name' | 'price' | 'category';
  currentValue: string | number | null;
  categories?: Category[];
  onSuccess: () => void;
}

export const QuickEditDialog = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  field,
  currentValue,
  categories = [],
  onSuccess,
}: QuickEditDialogProps) => {
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(currentValue?.toString() || '');
    }
  }, [open, currentValue]);

  const handleSave = async () => {
    setLoading(true);
    try {
      let updateData: Record<string, unknown> = {};

      switch (field) {
        case 'name':
          if (!value.trim()) {
            toast.error('El nombre no puede estar vacío');
            return;
          }
          updateData = { name: value.trim() };
          break;
        case 'price':
          const price = parseFloat(value);
          if (isNaN(price) || price < 0) {
            toast.error('Precio inválido');
            return;
          }
          updateData = { price };
          break;
        case 'category':
          updateData = { category_id: value || null };
          break;
      }

      const { error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Producto actualizado');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Error al actualizar producto');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (field) {
      case 'name':
        return 'Cambiar nombre';
      case 'price':
        return 'Cambiar precio';
      case 'category':
        return 'Cambiar categoría';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Editando: <span className="font-semibold">{itemName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {field === 'name' && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del producto</Label>
              <Input
                id="name"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Nombre del producto"
                autoFocus
              />
            </div>
          )}

          {field === 'price' && (
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
          )}

          {field === 'category' && (
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin categoría</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
