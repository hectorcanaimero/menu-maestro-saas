import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AssignGroupDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string | null;
  groupName: string;
  storeId: string;
}

export function AssignGroupDialog({ open, onClose, groupId, groupName, storeId }: AssignGroupDialogProps) {
  const [assignMode, setAssignMode] = useState<'category' | 'products'>('category');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Fetch all categories for this store
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['store-categories', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, menu_items(count)')
        .eq('store_id', storeId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId && open,
  });

  // Fetch all products for this store
  const { data: products, isLoading } = useQuery({
    queryKey: ['store-products', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, category_id, categories(name)')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId && open,
  });

  // Fetch the group to check if it's assigned to a category
  const { data: groupData, refetch: refetchGroup } = useQuery({
    queryKey: ['extra-group', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const { data, error } = await supabase
        .from('extra_groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!groupId && open,
  });

  // Fetch products that already have this group assigned
  const { data: assignedProducts, refetch: refetchAssigned } = useQuery({
    queryKey: ['group-assigned-products', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('product_extra_group_assignments')
        .select('product_id')
        .eq('group_id', groupId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId && open,
  });

  // Initialize selected products and category from already assigned
  useEffect(() => {
    if (assignedProducts) {
      const assigned = new Set(assignedProducts.map((a: any) => a.product_id));
      setSelectedProducts(assigned);
    }
  }, [assignedProducts]);

  useEffect(() => {
    if (groupData?.category_id) {
      setSelectedCategory(groupData.category_id);
      setAssignMode('category');
    }
  }, [groupData]);

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear selections when switching modes
  const handleModeChange = (newMode: 'category' | 'products') => {
    if (newMode === 'category') {
      // When switching to category mode, clear product selections
      setSelectedProducts(new Set());
    } else {
      // When switching to product mode, clear category selection
      setSelectedCategory(null);
    }
    setAssignMode(newMode);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!groupId) return;

    try {
      if (assignMode === 'category') {
        // Category assignment mode: Update the group's category_id
        if (!selectedCategory) {
          toast.error('Selecciona una categoría');
          return;
        }

        // Update the group to assign it to the category
        const { error: updateError } = await supabase
          .from('extra_groups')
          .update({ category_id: selectedCategory })
          .eq('id', groupId);

        if (updateError) throw updateError;

        // Remove any individual product assignments since this is now category-level
        const { error: deleteError } = await supabase
          .from('product_extra_group_assignments')
          .delete()
          .eq('group_id', groupId);

        if (deleteError) throw deleteError;

        const categoryName = categories?.find((c: any) => c.id === selectedCategory)?.name;
        toast.success(`Grupo asignado a la categoría "${categoryName}"`);
        refetchGroup();
        refetchAssigned();
        onClose();
      } else {
        // Product assignment mode: Create individual product_extras records
        // First, clear category assignment if it exists
        if (groupData?.category_id) {
          const { error: updateError } = await supabase
            .from('extra_groups')
            .update({ category_id: null })
            .eq('id', groupId);

          if (updateError) throw updateError;
        }

        // Get currently assigned product IDs
        const currentlyAssigned = new Set(assignedProducts?.map((a: any) => a.product_id) || []);

        // Products to add (selected but not currently assigned)
        const toAdd = Array.from(selectedProducts).filter((id) => !currentlyAssigned.has(id));

        // Products to remove (currently assigned but not selected)
        const toRemove = Array.from(currentlyAssigned).filter((id) => !selectedProducts.has(id));

        // Add new assignments - use the new mapping table
        if (toAdd.length > 0) {
          const newAssignments = toAdd.map((productId) => ({
            product_id: productId,
            group_id: groupId,
          }));

          const { error: insertError } = await supabase
            .from('product_extra_group_assignments')
            .insert(newAssignments);

          if (insertError) throw insertError;
        }

        // Remove assignments
        if (toRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from('product_extra_group_assignments')
            .delete()
            .eq('group_id', groupId)
            .in('product_id', toRemove);

          if (deleteError) throw deleteError;
        }

        toast.success(`Grupo asignado a ${selectedProducts.size} productos`);
        refetchGroup();
        refetchAssigned();
        onClose();
      }
    } catch (error) {
      console.error('Error assigning group:', error);
      toast.error('Error al asignar el grupo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar "{groupName}"</DialogTitle>
          <DialogDescription>
            Asigna este grupo de extras a una categoría completa o a productos específicos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode Selection Tabs */}
          <Tabs value={assignMode} onValueChange={(v) => handleModeChange(v as typeof assignMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="category">Por Categoría</TabsTrigger>
              <TabsTrigger value="products">Por Productos</TabsTrigger>
            </TabsList>

            {/* Category Assignment Tab */}
            <TabsContent value="category" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Selecciona una categoría y el grupo se aplicará automáticamente a todos los productos de esa categoría.
              </div>

              {loadingCategories ? (
                <div className="text-center py-8 text-muted-foreground">Cargando categorías...</div>
              ) : categories && categories.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {categories.map((category: any) => (
                    <Card
                      key={category.id}
                      className={`cursor-pointer transition-colors ${
                        selectedCategory === category.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {category.menu_items?.[0]?.count || 0} productos
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedCategory === category.id && (
                              <Badge variant="default">Seleccionado</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay categorías disponibles</p>
                </div>
              )}

              {/* Summary for category mode */}
              {selectedCategory && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Categoría seleccionada:{' '}
                    <span className="font-medium text-foreground">
                      {categories?.find((c: any) => c.id === selectedCategory)?.name}
                    </span>
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Product Assignment Tab */}
            <TabsContent value="products" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Selecciona productos individuales para asignarles este grupo de extras.
              </div>

              {/* Search */}
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Products List */}
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando productos...</div>
              ) : filteredProducts && filteredProducts.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product: any) => (
                    <Card
                      key={product.id}
                      className={`cursor-pointer transition-colors ${
                        selectedProducts.has(product.id) ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.categories?.name || 'Sin categoría'}
                            </p>
                          </div>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay productos disponibles</p>
                </div>
              )}

              {/* Summary for products mode */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {selectedProducts.size}{' '}
                  {selectedProducts.size === 1 ? 'producto seleccionado' : 'productos seleccionados'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar Asignación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
