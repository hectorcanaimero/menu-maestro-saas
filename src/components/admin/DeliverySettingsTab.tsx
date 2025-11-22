import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const deliverySchema = z.object({
  estimated_delivery_time: z.string().optional(),
  skip_payment_digital_menu: z.boolean().default(false),
  delivery_price_mode: z.enum(["fixed", "by_zone"]).default("fixed"),
  fixed_delivery_price: z.number().min(0).default(0),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

interface DeliveryZone {
  id: string;
  zone_name: string;
  delivery_price: number;
  display_order: number;
}

interface DeliverySettingsTabProps {
  storeId: string;
  initialData?: Partial<DeliveryFormData>;
}

export const DeliverySettingsTab = ({ storeId, initialData }: DeliverySettingsTabProps) => {
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZone, setNewZone] = useState({ zone_name: "", delivery_price: "" });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      estimated_delivery_time: initialData?.estimated_delivery_time || "",
      skip_payment_digital_menu: initialData?.skip_payment_digital_menu || false,
      delivery_price_mode: (initialData?.delivery_price_mode as "fixed" | "by_zone") || "fixed",
      fixed_delivery_price: initialData?.fixed_delivery_price || 0,
    },
  });

  const deliveryPriceMode = watch("delivery_price_mode");
  const skipPaymentDigitalMenu = watch("skip_payment_digital_menu");

  useEffect(() => {
    if (deliveryPriceMode === "by_zone") {
      fetchZones();
    }
  }, [deliveryPriceMode]);

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("store_id", storeId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
      toast.error("Error al cargar zonas de entrega");
    }
  };

  const onSubmit = async (data: DeliveryFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update({
          estimated_delivery_time: data.estimated_delivery_time || null,
          skip_payment_digital_menu: data.skip_payment_digital_menu,
          delivery_price_mode: data.delivery_price_mode,
          fixed_delivery_price: data.fixed_delivery_price,
        })
        .eq("id", storeId);

      if (error) throw error;
      toast.success("Configuración de entrega actualizada");
    } catch (error) {
      console.error("Error updating delivery settings:", error);
      toast.error("Error al actualizar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    if (!newZone.zone_name.trim() || !newZone.delivery_price) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      const { error } = await supabase
        .from("delivery_zones")
        .insert([
          {
            store_id: storeId,
            zone_name: newZone.zone_name,
            delivery_price: parseFloat(newZone.delivery_price),
            display_order: zones.length,
          },
        ]);

      if (error) throw error;
      toast.success("Zona agregada");
      setNewZone({ zone_name: "", delivery_price: "" });
      fetchZones();
    } catch (error) {
      console.error("Error adding zone:", error);
      toast.error("Error al agregar zona");
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta zona?")) return;

    try {
      const { error } = await supabase
        .from("delivery_zones")
        .delete()
        .eq("id", zoneId);

      if (error) throw error;
      toast.success("Zona eliminada");
      fetchZones();
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast.error("Error al eliminar zona");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="estimated_delivery_time">Tiempo estimado de envío</Label>
            <Input
              id="estimated_delivery_time"
              {...register("estimated_delivery_time")}
              placeholder="Ej: 30-45 minutos"
            />
            <p className="text-xs text-muted-foreground">
              Esta opción se muestra en la página de orden.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="skip_payment_digital_menu">
                  Skip payment for Order in Store
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable to skip payment section when order type is "Order in Store"
                </p>
                <p className="text-xs text-muted-foreground">
                  When enabled, orders placed as "Order in Store" (digital menu) will skip the
                  payment section and be marked as paid automatically.
                </p>
              </div>
              <Switch
                id="skip_payment_digital_menu"
                checked={skipPaymentDigitalMenu}
                onCheckedChange={(checked) => setValue("skip_payment_digital_menu", checked)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_price_mode">Modo de precio de entrega</Label>
              <Select
                value={deliveryPriceMode}
                onValueChange={(value: "fixed" | "by_zone") =>
                  setValue("delivery_price_mode", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Precio Fijo</SelectItem>
                  <SelectItem value="by_zone">Precio por Zona de envío</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Seleccione el modo de entrega para ver más opciones.
              </p>
            </div>

            {deliveryPriceMode === "fixed" && (
              <div className="space-y-2">
                <Label htmlFor="fixed_delivery_price">Precio de entrega fijo</Label>
                <Input
                  id="fixed_delivery_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("fixed_delivery_price", { valueAsNumber: true })}
                />
              </div>
            )}

            {deliveryPriceMode === "by_zone" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Precio por Zona de envío</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Definir precio de entrega por Barrios.
                  </p>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barrio</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zones.map((zone) => (
                        <TableRow key={zone.id}>
                          <TableCell className="font-medium">{zone.zone_name}</TableCell>
                          <TableCell>${zone.delivery_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteZone(zone.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>
                          <Input
                            placeholder="Nombre del barrio"
                            value={newZone.zone_name}
                            onChange={(e) =>
                              setNewZone({ ...newZone, zone_name: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={newZone.delivery_price}
                            onChange={(e) =>
                              setNewZone({ ...newZone, delivery_price: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" onClick={handleAddZone} size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            Añadir
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Importante</p>
                    <p className="text-xs text-muted-foreground">
                      Esta función depende de la API de Google Maps y Google puede aplicar los
                      costos. Google ofrece un límite de solicitudes gratuitas y después de este
                      límite se aplicarán costos. Puede consultar más detalles en:{" "}
                      <a
                        href="https://www.googlemaps.com/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        www.googlemaps.com/pricing
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
};
