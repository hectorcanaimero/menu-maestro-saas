/**
 * Extra Groups Manager
 *
 * Admin component for managing extra groups
 * Allows creating, editing, and deleting extra groups
 * Supports both category-level and product-specific groups
 */

import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useStoreExtraGroups, useCreateExtraGroup, useUpdateExtraGroup, useDeleteExtraGroup } from '@/hooks/useExtraGroups';
import { useStore } from '@/contexts/StoreContext';
import type { ExtraGroup, SelectionType } from '@/types/extras';

interface ExtraGroupFormData {
  name: string;
  description: string;
  selection_type: SelectionType;
  is_required: boolean;
  min_selections: number;
  max_selections: number | null;
  display_order: number;
  is_active: boolean;
  category_id: string | null;
}

interface ExtraGroupsManagerProps {
  categoryId?: string | null; // If provided, only show groups for this category
  showCategoryFilter?: boolean; // If true, show filter for category vs product-specific
}

export function ExtraGroupsManager({ categoryId, showCategoryFilter = true }: ExtraGroupsManagerProps) {
  const { store } = useStore();
  const { data: groups, isLoading } = useStoreExtraGroups(store?.id);
  const createGroup = useCreateExtraGroup();
  const updateGroup = useUpdateExtraGroup();
  const deleteGroup = useDeleteExtraGroup();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExtraGroup | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'category' | 'product'>('all');

  const [formData, setFormData] = useState<ExtraGroupFormData>({
    name: '',
    description: '',
    selection_type: 'multiple',
    is_required: false,
    min_selections: 0,
    max_selections: null,
    display_order: 0,
    is_active: true,
    category_id: categoryId || null,
  });

  // Filter groups based on categoryId prop or filter type
  const filteredGroups = groups?.filter((g) => {
    if (categoryId) {
      return g.category_id === categoryId;
    }
    if (filterType === 'category') {
      return g.category_id !== null;
    }
    if (filterType === 'product') {
      return g.category_id === null;
    }
    return true;
  });

  const handleOpenDialog = (group?: ExtraGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
        selection_type: group.selection_type,
        is_required: group.is_required,
        min_selections: group.min_selections,
        max_selections: group.max_selections,
        display_order: group.display_order,
        is_active: group.is_active,
        category_id: group.category_id,
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
        selection_type: 'multiple',
        is_required: false,
        min_selections: 0,
        max_selections: null,
        display_order: (filteredGroups?.length || 0) * 10,
        is_active: true,
        category_id: categoryId || null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGroup(null);
  };

  const handleSubmit = async () => {
    if (!store?.id) return;

    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({
          groupId: editingGroup.id,
          data: formData,
        });
      } else {
        await createGroup.mutateAsync({
          ...formData,
          store_id: store.id,
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (confirm('¿Estás seguro de eliminar este grupo? También se eliminarán todos los extras asociados.')) {
      try {
        await deleteGroup.mutateAsync(groupId);
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando grupos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Grupos de Extras</h3>
          <p className="text-sm text-muted-foreground">
            Organiza los extras en grupos con reglas de validación
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Crear Grupo
        </Button>
      </div>

      {/* Filter (only if showCategoryFilter is true and no categoryId) */}
      {showCategoryFilter && !categoryId && (
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Todos
          </Button>
          <Button
            variant={filterType === 'category' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('category')}
          >
            Nivel Categoría
          </Button>
          <Button
            variant={filterType === 'product' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('product')}
          >
            Nivel Producto
          </Button>
        </div>
      )}

      {/* Groups List */}
      {filteredGroups && filteredGroups.length > 0 ? (
        <div className="grid gap-3">
          {filteredGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      {group.category_id && (
                        <Badge variant="secondary" className="text-xs">
                          Categoría
                        </Badge>
                      )}
                      {group.is_required && (
                        <Badge variant="default" className="text-xs">
                          Requerido
                        </Badge>
                      )}
                      {!group.is_active && (
                        <Badge variant="outline" className="text-xs">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    {group.description && (
                      <CardDescription className="mt-1 text-xs">{group.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(group)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(group.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <List className="w-3 h-3" />
                    <span>
                      {group.selection_type === 'single' ? 'Selección única' : 'Selección múltiple'}
                    </span>
                  </div>
                  {group.min_selections > 0 && <span>Mín: {group.min_selections}</span>}
                  {group.max_selections && <span>Máx: {group.max_selections}</span>}
                  <span>Orden: {group.display_order}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay grupos de extras creados</p>
            <p className="text-xs mt-1">Crea un grupo para comenzar a organizar tus extras</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Crear Grupo'}</DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Modifica las propiedades del grupo de extras'
                : 'Crea un nuevo grupo de extras con reglas de validación'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej. Tamaño, Ingredientes, Color"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción del grupo (opcional)"
                rows={2}
              />
            </div>

            {/* Selection Type */}
            <div className="space-y-2">
              <Label htmlFor="selection_type">Tipo de Selección *</Label>
              <Select
                value={formData.selection_type}
                onValueChange={(value: SelectionType) => {
                  setFormData({
                    ...formData,
                    selection_type: value,
                    // Reset min/max for single selection
                    min_selections: value === 'single' ? 1 : formData.min_selections,
                    max_selections: value === 'single' ? 1 : formData.max_selections,
                  });
                }}
              >
                <SelectTrigger id="selection_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Selección única (radio buttons)</SelectItem>
                  <SelectItem value="multiple">Selección múltiple (checkboxes)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.selection_type === 'single'
                  ? 'El cliente solo puede seleccionar una opción'
                  : 'El cliente puede seleccionar múltiples opciones'}
              </p>
            </div>

            {/* Is Required */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_required" className="cursor-pointer">
                ¿Es requerido?
              </Label>
              <Switch
                id="is_required"
                checked={formData.is_required}
                onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
              />
            </div>

            {/* Min Selections */}
            <div className="space-y-2">
              <Label htmlFor="min_selections">Mínimo de Selecciones</Label>
              <Input
                id="min_selections"
                type="number"
                min="0"
                value={formData.min_selections}
                onChange={(e) => setFormData({ ...formData, min_selections: parseInt(e.target.value) || 0 })}
                disabled={formData.selection_type === 'single'}
              />
              <p className="text-xs text-muted-foreground">
                Número mínimo de opciones que el cliente debe seleccionar
              </p>
            </div>

            {/* Max Selections */}
            <div className="space-y-2">
              <Label htmlFor="max_selections">Máximo de Selecciones (opcional)</Label>
              <Input
                id="max_selections"
                type="number"
                min="1"
                value={formData.max_selections || ''}
                onChange={(e) =>
                  setFormData({ ...formData, max_selections: e.target.value ? parseInt(e.target.value) : null })
                }
                placeholder="Sin límite"
                disabled={formData.selection_type === 'single'}
              />
              <p className="text-xs text-muted-foreground">
                Número máximo de opciones. Dejar vacío para sin límite
              </p>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order">Orden de Visualización</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Orden en que aparece el grupo (menor número = aparece primero)
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active" className="cursor-pointer">
                Activo
              </Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || createGroup.isPending || updateGroup.isPending}>
              {editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
