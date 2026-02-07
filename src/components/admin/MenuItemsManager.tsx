import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useSubscription } from '@/hooks/useSubscription';
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
import { Plus, Pencil, Trash2, Image as ImageIcon, Star, Settings, Sparkles, MoreVertical, DollarSign, Tag, Type, Image, Package, Search, X, Filter } from 'lucide-react';
import { ProductExtrasManager } from './ProductExtrasManager';
import { MenuItemCard } from './MenuItemCard';
import { AIPhotoStudio } from './AIPhotoStudio';
import { QuickEditDialog } from './QuickEditDialog';
import { ImageSelectorDialog } from './ImageSelectorDialog';
import { ProductImageGallery } from './ProductImageGallery';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UpgradePlanModal } from './UpgradePlanModal';
import { Images } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  images: string[] | null;
  is_available: boolean | null;
  is_featured: boolean | null;
  display_order: number | null;
  stock_quantity: number | null;
  stock_minimum: number;
  track_stock: boolean;
}

interface Category {
  id: string;
  name: string;
}

const MenuItemsManager = () => {
  const { store } = useStore();
  const { canAddMore, usage, plan } = useSubscription();
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Bulk selection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Quick edit dialogs
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [quickEditField, setQuickEditField] = useState<'name' | 'price' | 'category'>('name');
  const [quickEditItemId, setQuickEditItemId] = useState<string>('');
  const [imageEditOpen, setImageEditOpen] = useState(false);
  const [imageEditItemId, setImageEditItemId] = useState<string>('');

  // Gallery dialog (for non-food stores)
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryItemId, setGalleryItemId] = useState<string>('');

  // Check if store allows gallery (non-food business)
  const isGalleryEnabled = store?.is_food_business === false;

  // Check if store allows stock tracking (non-food business)
  const isStockEnabled = store?.is_food_business === false;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true,
    is_featured: false,
    display_order: 0,
    track_stock: false,
    stock_quantity: '',
    stock_minimum: '0',
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
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow JPG and PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Solo se permiten imágenes JPG y PNG');
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
        // Stock fields (only for non-food stores)
        track_stock: isStockEnabled ? formData.track_stock : false,
        stock_quantity: isStockEnabled && formData.track_stock && formData.stock_quantity !== ''
          ? parseInt(formData.stock_quantity)
          : null,
        stock_minimum: isStockEnabled && formData.track_stock
          ? parseInt(formData.stock_minimum) || 0
          : 0,
      };

      if (editingItem) {
        // Don't update store_id on edit
        const { store_id, ...updateData } = itemData;
        const { error } = await supabase.from('menu_items').update(updateData).eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Producto actualizado');
      } else {
        // Validate product limit before creating
        const canAdd = await canAddMore('max_products');
        if (!canAdd) {
          const limit = plan?.limits?.max_products;
          const current = usage?.products?.current || 0;
          toast.error(
            `Has alcanzado el límite de productos de tu plan (${current}/${limit}). Actualiza tu plan para agregar más.`,
          );
          setDialogOpen(false);
          setShowUpgradeModal(true);
          return;
        }

        const { error } = await supabase.from('menu_items').insert([itemData]);

        if (error) throw error;
        toast.success('Producto creado');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
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
      track_stock: item.track_stock ?? false,
      stock_quantity: item.stock_quantity !== null ? item.stock_quantity.toString() : '',
      stock_minimum: (item.stock_minimum ?? 0).toString(),
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
      track_stock: false,
      stock_quantity: '',
      stock_minimum: '0',
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

  const getGalleryItem = () => {
    return items.find(item => item.id === galleryItemId);
  };

  const handleOpenGallery = (itemId: string) => {
    setGalleryItemId(itemId);
    setGalleryOpen(true);
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

  // Calculate products per category
  const categoryProductCounts = categories.reduce((acc, category) => {
    const count = items.filter(item => item.category_id === category.id).length;
    acc[category.id] = count;
    return acc;
  }, {} as Record<string, number>);

  // Filter items based on search query and category filter
  const filteredItems = items.filter((item) => {
    // Category filter
    const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter;
    if (!matchesCategory) return false;

    // Search filter
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(query);
    const matchesDescription = item.description?.toLowerCase().includes(query) || false;
    const categoryName = getCategoryName(item.category_id)?.toLowerCase() || '';
    const matchesCategoryName = categoryName.includes(query);

    return matchesName || matchesDescription || matchesCategoryName;
  });

  // Calculate totals
  const totalProducts = items.length;
  const displayedProducts = filteredItems.length;

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

      {isGalleryEnabled && (
        <ProductImageGallery
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          itemId={galleryItemId}
          itemName={getGalleryItem()?.name || ''}
          currentImages={getGalleryItem()?.images || []}
          mainImageUrl={getGalleryItem()?.image_url || null}
          onSuccess={fetchData}
        />
      )}

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
                            accept="image/jpeg,image/jpg,image/png"
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

                      {/* Stock Management - Only for non-food stores */}
                      {isStockEnabled && (
                        <div className="space-y-4 pt-2 border-t">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <Label htmlFor="track_stock" className="text-sm md:text-base flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Control de Inventario
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Activa para controlar el stock de este producto
                              </p>
                            </div>
                            <Switch
                              id="track_stock"
                              checked={formData.track_stock}
                              onCheckedChange={(checked) => setFormData({ ...formData, track_stock: checked })}
                              className="flex-shrink-0"
                            />
                          </div>

                          {formData.track_stock && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 border-l-2 border-primary/20">
                              <div className="space-y-2">
                                <Label htmlFor="stock_quantity" className="text-sm md:text-base">
                                  Cantidad en Stock
                                </Label>
                                <Input
                                  id="stock_quantity"
                                  type="number"
                                  min="0"
                                  value={formData.stock_quantity}
                                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                  placeholder="0"
                                  className="h-11 md:h-10 text-base md:text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="stock_minimum" className="text-sm md:text-base">
                                  Stock Minimo
                                </Label>
                                <Input
                                  id="stock_minimum"
                                  type="number"
                                  min="0"
                                  value={formData.stock_minimum}
                                  onChange={(e) => setFormData({ ...formData, stock_minimum: e.target.value })}
                                  placeholder="0"
                                  className="h-11 md:h-10 text-base md:text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Alerta cuando el stock llegue a este nivel
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
          {/* Product Statistics */}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Total: <strong className="text-foreground">{totalProducts}</strong> productos</span>
            </div>
            {(searchQuery.trim() || categoryFilter !== 'all') && (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>•</span>
                  <span>Mostrando: <strong className="text-primary">{displayedProducts}</strong> productos</span>
                </div>
                {categoryFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Categoría: {categories.find(c => c.id === categoryFilter)?.name}
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="secondary" className="gap-1">
                    Búsqueda: {searchQuery}
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Search and Filters */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos por nombre, descripción o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todas las categorías ({totalProducts})
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({categoryProductCounts[category.id] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery.trim() || categoryFilter !== 'all') && (
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedItems.size > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
              {/* Mobile: Two rows with dropdown */}
              <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedItems.size} producto(s) seleccionado(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground flex-shrink-0">Cambiar estado:</span>
                  <Select onValueChange={(value) => {
                    if (value === 'available') handleBulkAvailabilityChange(true);
                    else if (value === 'unavailable') handleBulkAvailabilityChange(false);
                    else if (value === 'hidden') handleBulkAvailabilityChange(null);
                  }}>
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Disponible</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="unavailable">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span>No disponible</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hidden">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          <span>No mostrar</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Desktop: Single row with buttons */}
              <div className="hidden sm:flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
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
            </div>
          )}

          {/* Mobile View - Cards */}
          <div className="grid gap-4 md:hidden">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">No se encontraron productos</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery.trim() && categoryFilter !== 'all'
                    ? 'No hay productos que coincidan con la búsqueda y categoría seleccionada.'
                    : searchQuery.trim()
                    ? 'No hay productos que coincidan con la búsqueda.'
                    : categoryFilter !== 'all'
                    ? 'No hay productos en esta categoría.'
                    : 'No hay productos. Crea uno para empezar.'}
                </p>
                {(searchQuery.trim() || categoryFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              filteredItems.map((item) => (
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
                  onOpenGallery={handleOpenGallery}
                  isGalleryEnabled={isGalleryEnabled}
                  isStockEnabled={isStockEnabled}
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
                      checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  {isStockEnabled && <TableHead>Stock</TableHead>}
                  <TableHead>Estado</TableHead>
                  <TableHead>Destacado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isStockEnabled ? 9 : 8} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Filter className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                        <p className="text-lg font-medium mb-2">No se encontraron productos</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {searchQuery.trim() && categoryFilter !== 'all'
                            ? 'No hay productos que coincidan con la búsqueda y categoría seleccionada.'
                            : searchQuery.trim()
                            ? 'No hay productos que coincidan con la búsqueda.'
                            : categoryFilter !== 'all'
                            ? 'No hay productos en esta categoría.'
                            : 'No hay productos. Crea uno para empezar.'}
                        </p>
                        {(searchQuery.trim() || categoryFilter !== 'all') && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchQuery('');
                              setCategoryFilter('all');
                            }}
                          >
                            Limpiar filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
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
                      {isStockEnabled && (
                        <TableCell>
                          {item.track_stock ? (
                            <div className="flex items-center gap-1">
                              {item.stock_quantity !== null && item.stock_quantity <= (item.stock_minimum ?? 0) ? (
                                <Badge variant="destructive" className="text-xs">
                                  {item.stock_quantity}
                                </Badge>
                              ) : (
                                <span className="text-sm">{item.stock_quantity ?? '-'}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
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
                              {isGalleryEnabled && (
                                <DropdownMenuItem onClick={() => handleOpenGallery(item.id)}>
                                  <Images className="w-4 h-4 mr-2" />
                                  Galería de imágenes
                                </DropdownMenuItem>
                              )}
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

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </>
  );
};

export default MenuItemsManager;
