/**
 * Admin Extra Groups Page
 *
 * Allows creating/managing extra groups and their child extras
 * Similar to Promotions - groups can be assigned to products or categories
 */

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Box, FolderTree, Settings2, ListPlus, Link2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/contexts/StoreContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useStoreExtraGroups,
  useCreateExtraGroup,
  useUpdateExtraGroup,
  useDeleteExtraGroup,
  useCreateProductExtra,
  useUpdateProductExtra,
  useDeleteProductExtra,
  useReorderExtraGroups,
  useReorderProductExtras,
} from '@/hooks/useExtraGroups';
import type { ExtraGroup, SelectionType, CreateExtraGroupData, ProductExtra } from '@/types/extras';
import { AssignGroupDialog } from '@/components/admin/AssignGroupDialog';
import { ExtraGroupsSortable } from '@/components/admin/ExtraGroupsSortable';
import { ProductExtrasSortable } from '@/components/admin/ProductExtrasSortable';

export default function AdminExtraGroups() {
  const { store } = useStore();
  const { data: groups, isLoading } = useStoreExtraGroups(store?.id);
  const createGroup = useCreateExtraGroup();
  const updateGroup = useUpdateExtraGroup();
  const deleteGroup = useDeleteExtraGroup();
  const reorderGroups = useReorderExtraGroups();
  const createExtra = useCreateProductExtra();
  const updateExtra = useUpdateProductExtra();
  const deleteExtra = useDeleteProductExtra();
  const reorderExtras = useReorderProductExtras();

  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isExtrasDialogOpen, setIsExtrasDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExtraGroup | null>(null);
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);
  const [assigningGroupId, setAssigningGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'category' | 'product'>('all');

  const [groupFormData, setGroupFormData] = useState<CreateExtraGroupData>({
    store_id: store?.id || '',
    category_id: null,
    name: '',
    description: '',
    selection_type: 'multiple',
    is_required: false,
    min_selections: 0,
    max_selections: null,
    display_order: 0,
    is_active: true,
  });

  // Fetch extras for managing group
  const { data: groupExtras, refetch: refetchExtras } = useQuery({
    queryKey: ['group-extras', managingGroupId],
    queryFn: async () => {
      if (!managingGroupId) return [];
      const { data, error } = await supabase
        .from('product_extras')
        .select('*')
        .eq('group_id', managingGroupId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!managingGroupId,
  });

  // Filter and sort groups based on tab
  const filteredGroups = groups
    ?.filter((g) => {
      if (activeTab === 'category') return g.category_id !== null;
      if (activeTab === 'product') return g.category_id === null;
      return true;
    })
    .sort((a, b) => a.display_order - b.display_order);

  const handleOpenGroupDialog = (group?: ExtraGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupFormData({
        store_id: group.store_id,
        category_id: group.category_id,
        name: group.name,
        description: group.description || '',
        selection_type: group.selection_type,
        is_required: group.is_required,
        min_selections: group.min_selections,
        max_selections: group.max_selections,
        display_order: group.display_order,
        is_active: group.is_active,
      });
    } else {
      setEditingGroup(null);
      setGroupFormData({
        store_id: store?.id || '',
        category_id: null,
        name: '',
        description: '',
        selection_type: 'multiple',
        is_required: false,
        min_selections: 0,
        max_selections: null,
        display_order: (groups?.length || 0) * 10,
        is_active: true,
      });
    }
    setIsGroupDialogOpen(true);
  };

  const handleCloseGroupDialog = () => {
    setIsGroupDialogOpen(false);
    setEditingGroup(null);
  };

  const handleSubmitGroup = async () => {
    if (!store?.id) return;

    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({
          groupId: editingGroup.id,
          data: groupFormData,
        });
      } else {
        const newGroup = await createGroup.mutateAsync({
          ...groupFormData,
          store_id: store.id,
        });
        // Open extras dialog after creating group
        setManagingGroupId(newGroup.id);
        setIsExtrasDialogOpen(true);
      }
      handleCloseGroupDialog();
    } catch (error) {
      //
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('¿Estás seguro de eliminar este grupo? También se eliminarán todos los extras asociados.')) {
      try {
        await deleteGroup.mutateAsync(groupId);
      } catch (error) {
        //
      }
    }
  };

  const handleOpenExtrasDialog = (groupId: string) => {
    setManagingGroupId(groupId);
    setIsExtrasDialogOpen(true);
    refetchExtras();
  };

  const handleCloseExtrasDialog = () => {
    setIsExtrasDialogOpen(false);
    setManagingGroupId(null);
  };

  const handleOpenAssignDialog = (groupId: string) => {
    setAssigningGroupId(groupId);
    setIsAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setIsAssignDialogOpen(false);
    setAssigningGroupId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Grupos de Extras</h1>
            <p className="text-muted-foreground mt-1">Crea grupos de extras con sus opciones y precios</p>
          </div>
          <Button onClick={() => handleOpenGroupDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Grupo
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <ListPlus className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">1. Crear Grupo</p>
                  <p className="text-muted-foreground">Define nombre, tipo de selección y reglas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Box className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">2. Agregar Extras</p>
                  <p className="text-muted-foreground">Define las opciones con nombre y precio</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FolderTree className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">3. Asignar</p>
                  <p className="text-muted-foreground">Asigna el grupo a productos o categorías</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">Todos ({groups?.length || 0})</TabsTrigger>
            <TabsTrigger value="category">
              Nivel Categoría ({groups?.filter((g) => g.category_id !== null).length || 0})
            </TabsTrigger>
            <TabsTrigger value="product">
              Nivel Producto ({groups?.filter((g) => g.category_id === null).length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">Cargando grupos...</div>
            ) : filteredGroups && filteredGroups.length > 0 ? (
              <ExtraGroupsSortable
                groups={filteredGroups}
                onReorder={(updates) => reorderGroups.mutate(updates)}
                renderGroup={(group) => (
                  <GroupCard
                    group={group}
                    onEdit={() => handleOpenGroupDialog(group)}
                    onDelete={() => handleDeleteGroup(group.id)}
                    onManageExtras={() => handleOpenExtrasDialog(group.id)}
                    onAssign={() => handleOpenAssignDialog(group.id)}
                  />
                )}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay grupos de extras en esta categoría</p>
                  <p className="text-xs mt-1">Crea un grupo para comenzar</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Group Dialog */}
        <GroupDialog
          open={isGroupDialogOpen}
          onClose={handleCloseGroupDialog}
          editing={editingGroup}
          formData={groupFormData}
          setFormData={setGroupFormData}
          onSubmit={handleSubmitGroup}
          isSubmitting={createGroup.isPending || updateGroup.isPending}
        />

        {/* Manage Extras Dialog */}
        <ExtrasDialog
          open={isExtrasDialogOpen}
          onClose={handleCloseExtrasDialog}
          groupId={managingGroupId}
          groupName={groups?.find((g) => g.id === managingGroupId)?.name || ''}
          extras={groupExtras || []}
          refetchExtras={refetchExtras}
          createExtra={createExtra}
          updateExtra={updateExtra}
          deleteExtra={deleteExtra}
          reorderExtras={reorderExtras}
        />

        {/* Assign to Products Dialog */}
        {store?.id && (
          <AssignGroupDialog
            open={isAssignDialogOpen}
            onClose={handleCloseAssignDialog}
            groupId={assigningGroupId}
            groupName={groups?.find((g) => g.id === assigningGroupId)?.name || ''}
            storeId={store.id}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// GroupCard Component
function GroupCard({
  group,
  onEdit,
  onDelete,
  onManageExtras,
  onAssign,
}: {
  group: ExtraGroup;
  onEdit: () => void;
  onDelete: () => void;
  onManageExtras: () => void;
  onAssign: () => void;
}) {
  // Fetch extras count for this group
  const { data: extras } = useQuery({
    queryKey: ['group-extras-count', group.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_extras')
        .select('id', { count: 'exact', head: false })
        .eq('group_id', group.id);
      if (error) throw error;
      return data || [];
    },
  });

  const extrasCount = extras?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{group.name}</CardTitle>
              {group.category_id && (
                <Badge variant="secondary" className="text-xs">
                  <FolderTree className="w-3 h-3 mr-1" />
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
              <CardDescription className="mt-1 text-xs line-clamp-2">{group.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Details */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="bg-muted px-2 py-1 rounded">
              {group.selection_type === 'single' ? '● Única' : '☐ Múltiple'}
            </span>
            {group.min_selections > 0 && (
              <span className="bg-muted px-2 py-1 rounded">Mín: {group.min_selections}</span>
            )}
            {group.max_selections && <span className="bg-muted px-2 py-1 rounded">Máx: {group.max_selections}</span>}
            <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">
              {extrasCount} {extrasCount === 1 ? 'extra' : 'extras'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="flex-1" onClick={onManageExtras}>
                <ListPlus className="w-3 h-3 mr-1" />
                Extras {extrasCount > 0 && `(${extrasCount})`}
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <Button variant="secondary" size="sm" className="w-full" onClick={onAssign}>
              <Link2 className="w-3 h-3 mr-1" />
              Asignar a Productos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// GroupDialog Component
function GroupDialog({
  open,
  onClose,
  editing,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  editing: ExtraGroup | null;
  formData: CreateExtraGroupData;
  setFormData: (data: CreateExtraGroupData) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Grupo' : 'Crear Grupo de Extras'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Modifica las propiedades del grupo'
              : 'Paso 1: Define el grupo. Luego podrás agregar los extras individuales.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre del Grupo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ej. Tamaño, Ingredientes, Color"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve descripción"
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
                  min_selections: value === 'single' ? 1 : formData.min_selections,
                  max_selections: value === 'single' ? 1 : formData.max_selections,
                });
              }}
            >
              <SelectTrigger id="selection_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">● Única - Solo UNA opción</SelectItem>
                <SelectItem value="multiple">☐ Múltiple - VARIAS opciones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Is Required */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="is_required" className="font-medium">
                ¿Es obligatorio?
              </Label>
              <p className="text-xs text-muted-foreground mt-1">El cliente debe seleccionar al menos el mínimo</p>
            </div>
            <Switch
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
            />
          </div>

          {/* Min/Max */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_selections">Mínimo</Label>
              <Input
                id="min_selections"
                type="number"
                min="0"
                value={formData.min_selections}
                onChange={(e) => setFormData({ ...formData, min_selections: parseInt(e.target.value) || 0 })}
                disabled={formData.selection_type === 'single'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_selections">Máximo</Label>
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
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="is_active" className="font-medium">
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
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={!formData.name || isSubmitting}>
            {editing ? 'Guardar' : 'Crear y Continuar →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ExtrasDialog Component
function ExtrasDialog({
  open,
  onClose,
  groupId,
  groupName,
  extras,
  refetchExtras,
  createExtra,
  updateExtra,
  deleteExtra,
  reorderExtras,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string | null;
  groupName: string;
  extras: ProductExtra[];
  refetchExtras: () => void;
  createExtra: any;
  updateExtra: any;
  deleteExtra: any;
  reorderExtras: any;
}) {
  const [editingExtra, setEditingExtra] = useState<ProductExtra | null>(null);
  const [extraName, setExtraName] = useState('');
  const [extraDescription, setExtraDescription] = useState('');
  const [extraPrice, setExtraPrice] = useState('');
  const [extraIsAvailable, setExtraIsAvailable] = useState(true);

  const handleAddExtra = async () => {
    if (!groupId || !extraName) return;

    try {
      await createExtra.mutateAsync({
        group_id: groupId,
        name: extraName,
        description: extraDescription || null,
        price: parseFloat(extraPrice) || 0,
        is_available: extraIsAvailable,
        is_default: false,
        display_order: extras.length * 10,
      });
      setExtraName('');
      setExtraDescription('');
      setExtraPrice('');
      setExtraIsAvailable(true);
      refetchExtras();
    } catch (error) {
      //
    }
  };

  const handleUpdateExtra = async () => {
    if (!editingExtra) return;

    try {
      await updateExtra.mutateAsync({
        extraId: editingExtra.id,
        data: {
          name: extraName,
          description: extraDescription || null,
          price: parseFloat(extraPrice),
          is_available: extraIsAvailable,
        },
      });
      setEditingExtra(null);
      setExtraName('');
      setExtraDescription('');
      setExtraPrice('');
      setExtraIsAvailable(true);
      refetchExtras();
    } catch (error) {
      //
    }
  };

  const handleToggleAvailability = async (extra: ProductExtra) => {
    try {
      await updateExtra.mutateAsync({
        extraId: extra.id,
        data: {
          is_available: !extra.is_available,
        },
      });
      refetchExtras();
    } catch (error) {
      //
    }
  };

  const handleDeleteExtra = async (extraId: string) => {
    if (!confirm('¿Eliminar este extra?')) return;

    try {
      await deleteExtra.mutateAsync(extraId);
      refetchExtras();
    } catch (error) {
      //
    }
  };

  const startEdit = (extra: ProductExtra) => {
    setEditingExtra(extra);
    setExtraName(extra.name);
    setExtraDescription(extra.description || '');
    setExtraPrice(extra.price.toString());
    setExtraIsAvailable(extra.is_available ?? true);
  };

  const cancelEdit = () => {
    setEditingExtra(null);
    setExtraName('');
    setExtraDescription('');
    setExtraPrice('');
    setExtraIsAvailable(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Gestionar Extras: {groupName}</DialogTitle>
          <DialogDescription>Define las opciones individuales con su nombre y precio</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add/Edit Form */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,120px] gap-3">
                <div className="space-y-2">
                  <Label htmlFor="extra_name">Nombre del Extra *</Label>
                  <Input
                    id="extra_name"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                    placeholder="ej. Pequeña, Pepperoni, Azul"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra_price">Precio</Label>
                  <Input
                    id="extra_price"
                    type="number"
                    step="0.01"
                    value={extraPrice}
                    onChange={(e) => setExtraPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="extra_description">Descripción (opcional)</Label>
                <Input
                  id="extra_description"
                  value={extraDescription}
                  onChange={(e) => setExtraDescription(e.target.value)}
                  placeholder="Breve descripción del extra"
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="extra_available" className="font-medium">Disponible</Label>
                  <p className="text-xs text-muted-foreground">Si está desactivado, no se mostrará a los clientes</p>
                </div>
                <Switch
                  id="extra_available"
                  checked={extraIsAvailable}
                  onCheckedChange={setExtraIsAvailable}
                />
              </div>
              <div className="flex gap-2 justify-end">
                {editingExtra ? (
                  <>
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdateExtra} disabled={!extraName}>
                      Guardar
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleAddExtra} disabled={!extraName}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar Extra
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Extras List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Extras creados ({extras.length})</Label>
            {extras.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">No hay extras aún</p>
                  <p className="text-xs mt-1">Agrega el primer extra arriba</p>
                </CardContent>
              </Card>
            ) : (
              <ProductExtrasSortable
                extras={extras}
                onReorder={(updates) => reorderExtras.mutate(updates)}
                renderExtra={(extra) => (
                  <Card className={extra.is_available === false ? 'opacity-60' : ''}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{extra.name}</p>
                            {extra.is_available === false && (
                              <Badge variant="secondary" className="text-xs">No disponible</Badge>
                            )}
                          </div>
                          {extra.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{extra.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground">${extra.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Switch
                            checked={extra.is_available ?? true}
                            onCheckedChange={() => handleToggleAvailability(extra)}
                            aria-label="Disponibilidad"
                          />
                          <Button variant="outline" size="sm" onClick={() => startEdit(extra)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteExtra(extra.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
