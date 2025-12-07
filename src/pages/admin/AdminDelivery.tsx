import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Package, Users, Settings, DollarSign, MapPin, Truck, Save, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { DriversManager } from "@/components/admin/DriversManager";
import { AdminDeliveryDashboard } from "@/components/delivery/AdminDeliveryDashboard";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { H2, H3, Body, Caption } from "@/components/ui/typography";
import { useModuleAccess } from "@/hooks/useSubscription";
import { ModuleNotAvailable } from "@/components/admin/ModuleNotAvailable";

export default function AdminDelivery() {
  const { store, reloadStore } = useStore();
  const { data: hasDeliveryModule, isLoading: checkingModule } = useModuleAccess('delivery');
  const [activeTab, setActiveTab] = useState("drivers");
  const [saving, setSaving] = useState(false);

  // Delivery settings form
  const [deliverySettings, setDeliverySettings] = useState({
    base_delivery_price: store?.base_delivery_price ?? 2.0,
    price_per_km: store?.price_per_km ?? 0.5,
    max_delivery_distance_km: store?.max_delivery_distance_km ?? 15,
    delivery_price_mode_v2: store?.delivery_price_mode_v2 ?? "fixed",
    store_lat: store?.store_lat ?? null,
    store_lng: store?.store_lng ?? null,
    store_address_full: store?.store_address_full ?? "",
  });

  const handleSaveSettings = async () => {
    if (!store?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update({
          base_delivery_price: deliverySettings.base_delivery_price,
          price_per_km: deliverySettings.price_per_km,
          max_delivery_distance_km: deliverySettings.max_delivery_distance_km,
          delivery_price_mode_v2: deliverySettings.delivery_price_mode_v2,
          store_lat: deliverySettings.store_lat,
          store_lng: deliverySettings.store_lng,
          store_address_full: deliverySettings.store_address_full,
        })
        .eq("id", store.id);

      if (error) throw error;

      toast.success("Configuración guardada");
      await reloadStore();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  // Geocode address using Google Maps
  const handleGeocodeAddress = async () => {
    if (!deliverySettings.store_address_full) {
      toast.error("Ingresa una dirección");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: deliverySettings.store_address_full },
      });

      if (error) throw error;

      if (!data || !data.lat || !data.lng) {
        throw new Error('No se pudieron obtener las coordenadas');
      }

      // Update the form with the geocoded coordinates
      setDeliverySettings({
        ...deliverySettings,
        store_lat: data.lat,
        store_lng: data.lng,
        store_address_full: data.formatted_address, // Use formatted address from Google
      });

      toast.success(`Coordenadas obtenidas: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`);
    } catch (error: any) {
      console.error("Error geocoding address:", error);
      toast.error(error.message || "Error al obtener coordenadas. Verifica que la dirección sea correcta.");
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (checkingModule) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-32 mb-4" />
          <Skeleton className="h-48" />
        </div>
      </AdminLayout>
    );
  }

  // Show module not available if delivery module is disabled
  if (!hasDeliveryModule) {
    return (
      <AdminLayout>
        <ModuleNotAvailable
          module="Delivery Avanzado"
          description="El sistema de delivery avanzado con motoristas, GPS tracking y cálculo por kilómetro está disponible en planes Enterprise. Contacta con soporte para habilitarlo."
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <H2>Sistema de Delivery</H2>
          <Caption className="text-muted-foreground">
            Gestiona tus motoristas, configura precios y rastrea entregas en tiempo real
          </Caption>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="drivers" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Motoristas</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configuración</span>
            </TabsTrigger>
          </TabsList>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="mt-6">
            <DriversManager />
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <AdminDeliveryDashboard />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Pricing Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Configuración de Precios
                  </CardTitle>
                  <CardDescription>Define cómo se calcula el costo de envío</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Modo de Precio de Delivery</Label>
                    <Select
                      value={deliverySettings.delivery_price_mode_v2}
                      onValueChange={(v) => setDeliverySettings({ ...deliverySettings, delivery_price_mode_v2: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Precio Fijo</SelectItem>
                        <SelectItem value="per_km">Por Kilómetro</SelectItem>
                        <SelectItem value="zones">Por Zonas</SelectItem>
                      </SelectContent>
                    </Select>
                    <Caption className="text-muted-foreground">
                      {deliverySettings.delivery_price_mode_v2 === "per_km"
                        ? "El precio se calcula automáticamente según la distancia"
                        : deliverySettings.delivery_price_mode_v2 === "zones"
                          ? "Usa las zonas de delivery configuradas"
                          : "Usa el precio fijo de delivery"}
                    </Caption>
                  </div>

                  {deliverySettings.delivery_price_mode_v2 === "per_km" && (
                    <>
                      <div className="space-y-2">
                        <Label>Precio Base ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={deliverySettings.base_delivery_price}
                          onChange={(e) =>
                            setDeliverySettings({
                              ...deliverySettings,
                              base_delivery_price: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <Caption className="text-muted-foreground">Costo mínimo de envío</Caption>
                      </div>

                      <div className="space-y-2">
                        <Label>Precio por Kilómetro ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={deliverySettings.price_per_km}
                          onChange={(e) =>
                            setDeliverySettings({
                              ...deliverySettings,
                              price_per_km: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Distancia Máxima (km)</Label>
                        <Input
                          type="number"
                          value={deliverySettings.max_delivery_distance_km}
                          onChange={(e) =>
                            setDeliverySettings({
                              ...deliverySettings,
                              max_delivery_distance_km: parseFloat(e.target.value) || 15,
                            })
                          }
                        />
                        <Caption className="text-muted-foreground">
                          No se permitirán entregas más allá de esta distancia
                        </Caption>
                      </div>
                    </>
                  )}

                  <div className="pt-4 p-4 bg-muted rounded-lg">
                    <Body size="small" className="font-medium mb-2">
                      Ejemplo de cálculo:
                    </Body>
                    <Caption className="text-muted-foreground">
                      Para una entrega de 5 km:{" "}
                      <span className="font-medium text-foreground">
                        ${deliverySettings.base_delivery_price} + (5 × ${deliverySettings.price_per_km}) = $
                        {(deliverySettings.base_delivery_price + 5 * deliverySettings.price_per_km).toFixed(2)}
                      </span>
                    </Caption>
                  </div>
                </CardContent>
              </Card>

              {/* Location Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Ubicación de la Tienda
                  </CardTitle>
                  <CardDescription>Configura la ubicación para calcular distancias</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Dirección Completa</Label>
                    <Input
                      value={deliverySettings.store_address_full}
                      onChange={(e) =>
                        setDeliverySettings({
                          ...deliverySettings,
                          store_address_full: e.target.value,
                        })
                      }
                      placeholder="Av. Principal #123, Ciudad"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Latitud</Label>
                      <Input
                        type="number"
                        step="any"
                        value={deliverySettings.store_lat || ""}
                        onChange={(e) =>
                          setDeliverySettings({
                            ...deliverySettings,
                            store_lat: parseFloat(e.target.value) || null,
                          })
                        }
                        placeholder="10.4806"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitud</Label>
                      <Input
                        type="number"
                        step="any"
                        value={deliverySettings.store_lng || ""}
                        onChange={(e) =>
                          setDeliverySettings({
                            ...deliverySettings,
                            store_lng: parseFloat(e.target.value) || null,
                          })
                        }
                        placeholder="-66.9036"
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGeocodeAddress}
                    disabled={saving || !deliverySettings.store_address_full}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Obteniendo coordenadas...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Obtener Coordenadas
                      </>
                    )}
                  </Button>

                  {deliverySettings.store_lat && deliverySettings.store_lng && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <MapPin className="w-4 h-4" />
                        <Body size="small" className="font-medium">
                          Ubicación configurada
                        </Body>
                      </div>
                      <Caption className="text-green-600 dark:text-green-500 mt-1">
                        {deliverySettings.store_lat}, {deliverySettings.store_lng}
                      </Caption>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
