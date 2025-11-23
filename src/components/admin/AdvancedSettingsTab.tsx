import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Volume2 } from "lucide-react";
import { playNotificationSound } from "@/lib/notificationSound";

interface AdvancedSettingsTabProps {
  storeId: string;
  initialData: {
    remove_zipcode: boolean | null;
    remove_address_number: boolean | null;
    enable_audio_notifications: boolean | null;
    notification_volume: number | null;
    notification_repeat_count: number | null;
  };
}

export const AdvancedSettingsTab = ({ storeId, initialData }: AdvancedSettingsTabProps) => {
  const [saving, setSaving] = useState(false);
  const [removeZipcode, setRemoveZipcode] = useState(initialData.remove_zipcode ?? false);
  const [removeAddressNumber, setRemoveAddressNumber] = useState(initialData.remove_address_number ?? false);
  const [enableAudioNotifications, setEnableAudioNotifications] = useState(
    initialData.enable_audio_notifications ?? true
  );
  const [notificationVolume, setNotificationVolume] = useState(initialData.notification_volume ?? 80);
  const [notificationRepeatCount, setNotificationRepeatCount] = useState(
    initialData.notification_repeat_count ?? 3
  );

  const handleTestSound = () => {
    playNotificationSound(notificationVolume, notificationRepeatCount);
    toast.info("Reproduciendo sonido de prueba...");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update({
          remove_zipcode: removeZipcode,
          remove_address_number: removeAddressNumber,
          enable_audio_notifications: enableAudioNotifications,
          notification_volume: notificationVolume,
          notification_repeat_count: notificationRepeatCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", storeId);

      if (error) throw error;

      toast.success("Configuración avanzada guardada correctamente");
    } catch (error: any) {
      console.error("Error saving advanced settings:", error);
      toast.error("Error al guardar la configuración avanzada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="border-0 shadow-none md:border md:shadow-sm">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-xl md:text-2xl">Ajustes avanzados</CardTitle>
          <CardDescription className="text-sm">En esta sección puede configurar algunos ajustes avanzados.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 space-y-4 md:space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:space-x-4">
              <div className="flex-1">
                <Label htmlFor="remove-zipcode" className="text-sm md:text-base">
                  Eliminar código postal
                </Label>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Sí, eliminar la entrada del código postal. Elimine la entrada y la verificación del campo Código
                  postal.
                </p>
              </div>
              <Switch
                id="remove-zipcode"
                checked={removeZipcode}
                onCheckedChange={setRemoveZipcode}
                className="self-start md:self-auto"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:space-x-4">
              <div className="flex-1">
                <Label htmlFor="remove-address-number" className="text-sm md:text-base">
                  Eliminar número de dirección
                </Label>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Sí, elimine la entrada de número de dirección. Elimine la entrada y la verificación del campo de
                  número de dirección.
                </p>
              </div>
              <Switch
                id="remove-address-number"
                checked={removeAddressNumber}
                onCheckedChange={setRemoveAddressNumber}
                className="self-start md:self-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-none md:border md:shadow-sm">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-xl md:text-2xl">Notification Settings</CardTitle>
          <CardDescription className="text-sm">
            Configure audio notifications for new orders in the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:space-x-4">
            <div className="flex-1">
              <Label htmlFor="audio-notifications" className="text-sm md:text-base">
                Audio Notifications
              </Label>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Enable audio notifications for new orders. Play a sound alert when new orders are received in the
                admin panel.
              </p>
            </div>
            <Switch
              id="audio-notifications"
              checked={enableAudioNotifications}
              onCheckedChange={setEnableAudioNotifications}
              className="self-start md:self-auto"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notification-volume" className="text-sm md:text-base">
                Notification Volume
              </Label>
              <span className="text-xs md:text-sm text-muted-foreground">{notificationVolume}%</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Set the volume level for notification sounds (0-100%).
            </p>
            <Slider
              id="notification-volume"
              value={[notificationVolume]}
              onValueChange={(value) => setNotificationVolume(value[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
              disabled={!enableAudioNotifications}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notification-repeat" className="text-sm md:text-base">
                Repeat Count
              </Label>
              <span className="text-xs md:text-sm text-muted-foreground">
                {notificationRepeatCount} {notificationRepeatCount === 1 ? "time" : "times"}
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">How many times to repeat the notification sound.</p>
            <Slider
              id="notification-repeat"
              value={[notificationRepeatCount]}
              onValueChange={(value) => setNotificationRepeatCount(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
              disabled={!enableAudioNotifications}
            />
          </div>

          <div className="pt-3 md:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestSound}
              disabled={!enableAudioNotifications}
              className="w-full h-11 md:h-10 text-base md:text-sm"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Probar sonido de notificación
            </Button>
            <p className="text-xs md:text-xs text-muted-foreground mt-2 text-center">
              Haz clic para escuchar cómo sonarán las notificaciones con la configuración actual
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto h-11 md:h-10 text-base md:text-sm">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Guardar cambios
      </Button>
    </div>
  );
};
