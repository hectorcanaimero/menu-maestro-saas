import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image as ImageIcon, Star, Settings } from "lucide-react";
import { ProductExtrasManager } from "./ProductExtrasManager";
import { MenuItemCard } from "./MenuItemCard";

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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
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
        supabase.from("menu_items").select("*").eq("store_id", store.id).order("display_order", { ascending: true }),
        supabase.from("categories").select("id, name").eq("store_id", store.id).order("name"),
      ]);

      if (itemsResponse.error) throw itemsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setItems(itemsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("Imagen subida correctamente");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!store?.id) {
      toast.error("No se pudo identificar la tienda");
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
        const { error } = await supabase
          .from("menu_items")
          .update(updateData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Platillo actualizado");
      } else {
        const { error } = await supabase
          .from("menu_items")
          .insert([itemData]);

        if (error) throw error;
        toast.success("Platillo creado");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Error al guardar platillo");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category_id: item.category_id || "",
      image_url: item.image_url || "",
      is_available: item.is_available ?? true,
      is_featured: item.is_featured ?? false,
      display_order: item.display_order || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este platillo?")) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Platillo eliminado");
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Error al eliminar platillo");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
      image_url: "",
      is_available: true,
      is_featured: false,
      display_order: 0,
    });
    setEditingItem(null);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "-";
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <>
      <ProductExtrasManager
        open={extrasDialogOpen}
        onOpenChange={setExtrasDialogOpen}
        menuItemId={selectedItem?.id || ""}
        menuItemName={selectedItem?.name || ""}
      />
      
      <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Gestión de Platillos</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Platillo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Platillo" : "Nuevo Platillo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Essential Fields - Always Visible */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm md:text-base">Nombre del Platillo</Label>
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
                  <Label htmlFor="description" className="text-sm md:text-base">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe brevemente el platillo..."
                    className="min-h-20 text-base md:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm md:text-base">Precio</Label>
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
                    <Label htmlFor="category" className="text-sm md:text-base">Categoría</Label>
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
                      <Label htmlFor="image" className="text-sm md:text-base">Imagen del Producto</Label>
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
                            <img
                              src={formData.image_url}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sube una imagen del platillo (opcional)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="available" className="text-sm md:text-base">Disponibilidad</Label>
                        <Select
                          value={formData.is_available.toString()}
                          onValueChange={(value) => setFormData({ ...formData, is_available: value === "true" })}
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
                        <Label htmlFor="order" className="text-sm md:text-base">Orden de Visualización</Label>
                        <Input
                          id="order"
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                          className="h-11 md:h-10 text-base md:text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Número menor aparece primero
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="featured" className="text-sm md:text-base">Producto Destacado</Label>
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
                {uploading ? "Subiendo imagen..." : editingItem ? "Actualizar Platillo" : "Crear Platillo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Mobile View - Cards */}
        <div className="grid gap-4 md:hidden">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay platillos. Crea uno para empezar.
            </div>
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
              />
            ))
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay platillos. Crea uno para empezar.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
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
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.is_available
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}>
                        {item.is_available ? "Disponible" : "No disponible"}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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