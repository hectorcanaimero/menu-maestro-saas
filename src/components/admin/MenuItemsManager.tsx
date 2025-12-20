import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Image as ImageIcon, Star, Settings, Sparkles, MoreVertical, DollarSign, Tag, Type, Image } from 'lucide-react';
import { ProductExtrasManager } from './ProductExtrasManager';
import { MenuItemCard } from './MenuItemCard';
import { AIPhotoStudio } from './AIPhotoStudio';
import { QuickEditDialog } from './QuickEditDialog';
import { ImageSelectorDialog } from './ImageSelectorDialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_available: boolean | null;
  is_featured: boolean | null;
  display_order: number | null;
}

interface Category {
  id: string;
  name: string;
}

const MenuItemsManager = () => {
  const { store } = useStore();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extrasDialogOpen, setExtrasDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [aiStudioOpen, setAiStudioOpen] = useState(false);
  const [aiStudioItem, setAiStudioItem] = useState<MenuItem | null>(null);

  // Bulk selection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Quick edit dialogs
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [quickEditField, setQuickEditField] = useState<'name' | 'price' | 'category'>('name');
  const [quickEditItemId, setQuickEditItemId] = useState<string>('');
  const [imageEditOpen, setImageEditOpen] = useState(false);
  const [imageEditItemId, setImageEditItemId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true,
    is_featured: false,
    display_order: 0,
  });

  useEffect(() => {
    if (store?.id) {
      fetchData();
    }
  }, [store?.id]);

  const fetchData = async () => {
    if (!store?.id) return;

    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        supabase.from('menu_items').select('*').eq('store_id', store.id).order('display_order', { ascending: true }),
        supabase.from('categories').select('id, name').eq('store_id', store.id).order('name'),
      ]);

      if (itemsResponse.error) throw itemsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setItems(itemsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('menu-images').upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('menu-images').getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!store?.id) {
      toast.error('No se pudo identificar la tienda');
      return;
    }

    try {
      const itemData = {
        store_id: store.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        image_url: formData.image_url || null,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        display_order: formData.display_order,
      };

      if (editingItem) {
        // Don't update store_id on edit
        const { store_id, ...updateData } = itemData;
        const { error } = await supabase.from('menu_items').update(updateData).eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Producto actualizado');
      } else {
        const { error } = await supabase.from('menu_items').insert([itemData]);

        if (error) throw error;
        toast.success('Producto creado');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Error al guardar producto');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category_id: item.category_id || '',
      image_url: item.image_url || '',
      is_available: item.is_available ?? true,
      is_featured: item.is_featured ?? false,
      display_order: item.display_order || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);

      if (error) throw error;
      toast.success('Producto eliminado');
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error al eliminar producto');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      image_url: '',
      is_available: true,
      is_featured: false,
      display_order: 0,
    });
    setEditingItem(null);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '-';
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  const handleEnhanceWithAI = (item: MenuItem) => {
    setAiStudioItem(item);
    setAiStudioOpen(true);
  };

  // Bulk selection handlers
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleBulkAvailabilityChange = async (isAvailable: boolean | null) => {
    if (selectedItems.size === 0) {
      toast.error('No hay productos seleccionados');
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .in('id', Array.from(selectedItems));

      if (error) throw error;

      toast.success(`${selectedItems.size} producto(s) actualizado(s)`);
      setSelectedItems(new Set());
      fetchData();
    } catch (error) {
      console.error('Error updating items:', error);
      toast.error('Error al actualizar productos');
    }
  };

  // Quick edit handlers
  const handleQuickEdit = (itemId: string, field: 'name' | 'price' | 'category' | 'image') => {
    if (field === 'image') {
      setImageEditItemId(itemId);
      setImageEditOpen(true);
    } else {
      setQuickEditItemId(itemId);
      setQuickEditField(field);
      setQuickEditOpen(true);
    }
  };

  const getQuickEditItem = () => {
    return items.find(item => item.id === quickEditItemId);
  };

  const getImageEditItem = () => {
    return items.find(item => item.id === imageEditItemId);
  };

  const getQuickEditCurrentValue = () => {
    const item = getQuickEditItem();
    if (!item) return null;

    switch (quickEditField) {
      case 'name':
        return item.name;
      case 'price':
        return item.price;
      case 'category':
        return item.category_id;
      default:
        return null;
    }
  };

  return (
    <>
      <ProductExtrasManager
        open={extrasDialogOpen}
        onOpenChange={setExtrasDialogOpen}
        menuItemId={selectedItem?.id || ''}
        menuItemName={selectedItem?.name || ''}
      />

      <AIPhotoStudio
        open={aiStudioOpen}
        onOpenChange={setAiStudioOpen}
        menuItem={aiStudioItem}
        onImageUpdated={fetchData}
      />

      <QuickEditDialog
        open={quickEditOpen}
        onOpenChange={setQuickEditOpen}
        itemId={quickEditItemId}
        itemName={getQuickEditItem()?.name || ''}
        field={quickEditField}
        currentValue={getQuickEditCurrentValue()}
        categories={categories}
        onSuccess={fetchData}
      />

      <ImageSelectorDialog
        open={imageEditOpen}
        onOpenChange={setImageEditOpen}
        itemId={imageEditItemId}
        itemName={getImageEditItem()?.name || ''}
        currentImageUrl={getImageEditItem()?.image_url || null}
        onSuccess={fetchData}
      />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Gestión de Productos</CardTitle>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Essential Fields - Always Visible */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm md:text-base">
                      Nombre del Producto
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Ej: Hamburguesa Clásica"
                      className="h-11 md:h-10 text-base md:text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm md:text-base">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe brevemente el producto..."
                      className="min-h-20 text-base md:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm md:text-base">
                        Precio
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        placeholder="0.00"
                        className="h-11 md:h-10 text-base md:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm md:text-base">
                        Categoría
                      </Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      >
                        <SelectTrigger className="h-11 md:h-10">
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Advanced Options - Accordion */}
                <Accordion type="single" collapsible className="border rounded-lg">
                  <AccordionItem value="advanced" className="border-0">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <span className="text-sm font-medium">Opciones Avanzadas</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="image" className="text-sm md:text-base">
                          Imagen del Producto
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="h-11 md:h-10 text-base md:text-sm"
                          />
                          {formData.image_url && (
                            <div className="w-20 h-20 border rounded overflow-hidden flex-shrink-0">
                              <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Sube una imagen del producto (opcional)</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="available" className="text-sm md:text-base">
                            Disponibilidad
                          </Label>
                          <Select
                            value={formData.is_available.toString()}
                            onValueChange={(value) => setFormData({ ...formData, is_available: value === 'true' })}
                          >
                            <SelectTrigger className="h-11 md:h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Disponible</SelectItem>
                              <SelectItem value="false">No disponible</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="order" className="text-sm md:text-base">
                            Orden de Visualización
                          </Label>
                          <Input
                            id="order"
                            type="number"
                            value={formData.display_order}
                            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="h-11 md:h-10 text-base md:text-sm"
                          />
                          <p className="text-xs text-muted-foreground">Número menor aparece primero</p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <Label htmlFor="featured" className="text-sm md:text-base">
                              Producto Destacado
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Los productos destacados aparecen en el carrusel principal
                            </p>
                          </div>
                          <Switch
                            id="featured"
                            checked={formData.is_featured}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                            className="flex-shrink-0"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button type="submit" className="w-full h-11 md:h-10 text-base md:text-sm" disabled={uploading}>
                  {uploading ? 'Subiendo imagen...' : editingItem ? 'Actualizar Producto' : 'Crear Producto'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions Toolbar */}
          {selectedItems.size > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.size === items.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedItems.size} producto(s) seleccionado(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-2">Cambiar estado:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAvailabilityChange(true)}
                  className="bg-green-50 hover:bg-green-100"
                >
                  Disponible
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAvailabilityChange(false)}
                  className="bg-red-50 hover:bg-red-100"
                >
                  No disponible
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAvailabilityChange(null)}
                  className="bg-gray-50 hover:bg-gray-100"
                >
                  No mostrar
                </Button>
              </div>
            </div>
          )}

          {/* Mobile View - Cards */}
          <div className="grid gap-4 md:hidden">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay producto. Crea uno para empezar.</div>
            ) : (
              items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  categoryName={getCategoryName(item.category_id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onManageExtras={(item) => {
                    setSelectedItem(item);
                    setExtrasDialogOpen(true);
                  }}
                  onEnhanceWithAI={handleEnhanceWithAI}
                  selected={selectedItems.has(item.id)}
                  onSelectChange={(selected) => toggleItemSelection(item.id)}
                  onQuickEdit={handleQuickEdit}
                />
              ))
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={items.length > 0 && selectedItems.size === items.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Destacado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No hay productos. Crea uno para empezar.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className={selectedItems.has(item.id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getCategoryName(item.category_id)}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.is_available
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}
                        >
                          {item.is_available ? 'Disponible' : 'No disponible'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.is_featured && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Star className="w-4 h-4 fill-amber-600" />
                            <span className="text-xs">Destacado</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.image_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEnhanceWithAI(item)}
                              title="Mejorar con IA"
                            >
                              <Sparkles className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedItem(item);
                              setExtrasDialogOpen(true);
                            }}
                            title="Gestionar extras"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleQuickEdit(item.id, 'name')}>
                                <Type className="w-4 h-4 mr-2" />
                                Cambiar nombre
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickEdit(item.id, 'price')}>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Cambiar precio
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickEdit(item.id, 'category')}>
                                <Tag className="w-4 h-4 mr-2" />
                                Cambiar categoría
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickEdit(item.id, 'image')}>
                                <Image className="w-4 h-4 mr-2" />
                                Cambiar imagen
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar completo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default MenuItemsManager;
