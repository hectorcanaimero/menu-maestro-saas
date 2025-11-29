import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface StoreHour {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

interface BusinessHoursTabProps {
  storeId: string;
  forceStatus: "normal" | "force_open" | "force_closed" | null;
}

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export function BusinessHoursTab({ storeId, forceStatus }: BusinessHoursTabProps) {
  const [hours, setHours] = useState<StoreHour[]>([]);
  const [currentForceStatus, setCurrentForceStatus] = useState<string>(forceStatus || "normal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHours();
  }, [storeId]);

  const loadHours = async () => {
    try {
      const { data, error } = await supabase
        .from("store_hours")
        .select("*")
        .eq("store_id", storeId)
        .order("day_of_week", { ascending: true })
        .order("open_time", { ascending: true });

      if (error) throw error;
      setHours(data || []);
    } catch (error) {
      console.error("Error loading hours:", error);
      toast.error("Error al cargar los horarios");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHour = (dayOfWeek: number) => {
    setHours([...hours, { day_of_week: dayOfWeek, open_time: "09:00", close_time: "18:00" }]);
  };

  const handleRemoveHour = async (index: number) => {
    const hour = hours[index];
    if (hour.id) {
      try {
        const { error } = await supabase.from("store_hours").delete().eq("id", hour.id);
        if (error) throw error;
      } catch (error) {
        console.error("Error deleting hour:", error);
        toast.error("Error al eliminar el horario");
        return;
      }
    }
    setHours(hours.filter((_, i) => i !== index));
  };

  const handleUpdateHour = (index: number, field: "open_time" | "close_time", value: string) => {
    const newHours = [...hours];
    newHours[index][field] = value;
    setHours(newHours);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update force status
      const { error: forceError } = await supabase
        .from("stores")
        .update({ force_status: currentForceStatus as any })
        .eq("id", storeId);

      if (forceError) throw forceError;

      // Delete all existing hours
      const { error: deleteError } = await supabase
        .from("store_hours")
        .delete()
        .eq("store_id", storeId);

      if (deleteError) throw deleteError;

      // Insert new hours
      if (hours.length > 0) {
        const hoursToInsert = hours.map((h) => ({
          store_id: storeId,
          day_of_week: h.day_of_week,
          open_time: h.open_time,
          close_time: h.close_time,
        }));

        const { error: insertError } = await supabase.from("store_hours").insert(hoursToInsert);

        if (insertError) throw insertError;
      }

      toast.success("Horarios guardados correctamente");
      loadHours();
    } catch (error: unknown) {
      console.error("Error saving hours:", error);
      toast.error("Error al guardar los horarios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-none md:border md:shadow-sm">
      <CardHeader className="px-4 md:px-6">
        <CardTitle className="text-xl md:text-2xl">Configuración del horario de apertura</CardTitle>
        <CardDescription className="text-sm">
          Configura los horarios de atención de tu tienda por día de la semana.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6 space-y-4 md:space-y-8">
        <div className="space-y-2">
          <Label className="text-sm md:text-base">Forzar apertura/cierre de tienda</Label>
          <Select value={currentForceStatus} onValueChange={setCurrentForceStatus}>
            <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Respeta el horario configurado a continuación</SelectItem>
              <SelectItem value="force_open">Forzar la apertura de la tienda</SelectItem>
              <SelectItem value="force_closed">Forzar el cierre de la tienda</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs md:text-sm text-muted-foreground">
            Las configuraciones a continuación se ignorarán si usa esto.
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {DAYS.map((day) => {
            const dayHours = hours.filter((h) => h.day_of_week === day.value);
            return (
              <div key={day.value} className="space-y-3">
                <Label className="text-sm md:text-base font-semibold">{day.label}</Label>
                {dayHours.length === 0 ? (
                  <p className="text-xs md:text-sm text-muted-foreground">Cerrado</p>
                ) : (
                  dayHours.map((hour, idx) => {
                    const globalIndex = hours.findIndex(
                      (h) => h.day_of_week === day.value && h.open_time === hour.open_time
                    );
                    return (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                        <span className="text-xs md:text-sm min-w-[100px]">Comenzar en</span>
                        <Input
                          type="time"
                          value={hour.open_time}
                          onChange={(e) => handleUpdateHour(globalIndex, "open_time", e.target.value)}
                          className="h-11 md:h-10 text-base md:text-sm w-full md:w-32"
                        />
                        <span className="text-xs md:text-sm">Fin</span>
                        <Input
                          type="time"
                          value={hour.close_time}
                          onChange={(e) => handleUpdateHour(globalIndex, "close_time", e.target.value)}
                          className="h-11 md:h-10 text-base md:text-sm w-full md:w-32"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveHour(globalIndex)}
                          className="text-destructive hover:text-destructive h-11 md:h-10 text-base md:text-sm w-full md:w-auto"
                        >
                          eliminar
                        </Button>
                      </div>
                    );
                  })
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddHour(day.value)}
                  className="gap-2 h-11 md:h-10 text-base md:text-sm w-full md:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Añadir más
                </Button>
              </div>
            );
          })}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto h-11 md:h-10 text-base md:text-sm">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Guardar cambios
        </Button>
      </CardContent>
    </Card>
  );
}
