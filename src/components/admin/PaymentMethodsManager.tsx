import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  display_order: number | null;
}

interface PaymentMethodsManagerProps {
  storeId: string;
}

export function PaymentMethodsManager({ storeId }: PaymentMethodsManagerProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, [storeId]);

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("store_id", storeId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error("Error loading payment methods:", error);
      toast.error("Error al cargar los métodos de pago");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        description: method.description || "",
        is_active: method.is_active ?? true,
      });
    } else {
      setEditingMethod(null);
      setFormData({ name: "", description: "", is_active: true });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setSaving(true);
    try {
      if (editingMethod) {
        // Update existing method
        const { error } = await supabase
          .from("payment_methods")
          .update({
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMethod.id);

        if (error) throw error;
        toast.success("Método de pago actualizado");
      } else {
        // Create new method
        const { error } = await supabase.from("payment_methods").insert({
          store_id: storeId,
          name: formData.name,
          description: formData.description || null,
          is_active: formData.is_active,
          display_order: methods.length,
        });

        if (error) throw error;
        toast.success("Método de pago creado");
      }

      setDialogOpen(false);
      loadPaymentMethods();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Error al guardar el método de pago");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este método de pago?")) return;

    try {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);

      if (error) throw error;
      toast.success("Método de pago eliminado");
      loadPaymentMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Error al eliminar el método de pago");
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active: !method.is_active })
        .eq("id", method.id);

      if (error) throw error;
      loadPaymentMethods();
    } catch (error) {
      console.error("Error toggling payment method:", error);
      toast.error("Error al actualizar el método de pago");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Métodos de Pago</h3>
          <p className="text-sm text-muted-foreground">
            Administra los métodos de pago disponibles para tus clientes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Método
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? "Editar Método de Pago" : "Nuevo Método de Pago"}
              </DialogTitle>
              <DialogDescription>
                Configura la información del método de pago
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Pago Móvil, Zelle, Transferencia"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción / Instrucciones</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Transferir a la cuenta 0123-4567-8901. Banco Ejemplo."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Método activo</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingMethod ? "Guardar Cambios" : "Crear Método"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {methods.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">No hay métodos de pago configurados</p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Primer Método
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-muted-foreground truncate">
                      {method.description || "-"}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={method.is_active ?? false}
                      onCheckedChange={() => handleToggleActive(method)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(method)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        className="text-destructive hover:text-destructive"
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
      )}
    </div>
  );
}
