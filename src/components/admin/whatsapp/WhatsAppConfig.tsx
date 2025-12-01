import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  ShoppingBag,
  PackageCheck,
  ShoppingCart,
  Server,
  QrCode
} from "lucide-react";
import { useWhatsAppSettings } from "@/hooks/useWhatsAppSettings";
import { Separator } from "@/components/ui/separator";
import { WhatsAppConnectionModal } from "./WhatsAppConnectionModal";
import { useModuleAccess } from "@/hooks/useSubscription";
import { ModuleNotAvailable } from "@/components/admin/ModuleNotAvailable";

const WhatsAppConfig = () => {
  const { settings, loading, testing, instanceName, updateSettings, testConnection, disconnect, refetch } = useWhatsAppSettings();
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);

  // Verificar acceso al módulo de WhatsApp
  const { data: hasWhatsAppAccess, isLoading: checkingAccess } = useModuleAccess('whatsapp');

  if (loading || checkingAccess) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando configuración...
      </div>
    );
  }

  // Si no tiene acceso al módulo, mostrar mensaje
  if (!hasWhatsAppAccess) {
    return (
      <ModuleNotAvailable
        module="WhatsApp"
        description="Las notificaciones automáticas por WhatsApp están disponibles en planes Pro y Enterprise, o pueden ser habilitadas manualmente por el administrador de la plataforma."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Estado del Módulo
              </CardTitle>
              <CardDescription>
                Activa o desactiva el módulo de WhatsApp
              </CardDescription>
            </div>
            <Switch
              checked={settings?.is_enabled || false}
              onCheckedChange={(checked) => updateSettings({ is_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {settings?.is_enabled ? (
              <Badge className="bg-green-500">Módulo Activo</Badge>
            ) : (
              <Badge variant="secondary">Módulo Inactivo</Badge>
            )}
            {settings?.subscription_status === 'trial' && settings?.trial_ends_at && (
              <Badge variant="outline">
                Prueba hasta {new Date(settings.trial_ends_at).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Conexión WhatsApp
          </CardTitle>
          <CardDescription>
            Estado de la conexión con Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instance Info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Instancia</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {instanceName || 'No disponible'}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado de Conexión</span>
              {settings?.is_connected ? (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </Badge>
              )}
            </div>

            {settings?.connected_phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Número conectado</span>
                <span className="text-sm font-medium">{settings.connected_phone}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {!settings?.is_connected ? (
              <Button
                onClick={() => setConnectionModalOpen(true)}
                disabled={!instanceName}
                className="flex-1 sm:flex-none"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Conectar WhatsApp
              </Button>
            ) : (
              <>
                <Button
                  onClick={testConnection}
                  disabled={testing || !instanceName}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    "Probar Conexión"
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={disconnect}
                  className="flex-1 sm:flex-none"
                >
                  Desconectar
                </Button>
              </>
            )}
          </div>

          {!instanceName && (
            <p className="text-sm text-destructive">
              No se pudo obtener el subdomain de la tienda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Automations */}
      <Card>
        <CardHeader>
          <CardTitle>Automatizaciones</CardTitle>
          <CardDescription>
            Configura qué mensajes se envían automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Confirmación de Pedido</p>
                <p className="text-sm text-muted-foreground">
                  Enviar mensaje al crear un nuevo pedido
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.auto_order_confirmation || false}
              onCheckedChange={(checked) => updateSettings({ auto_order_confirmation: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PackageCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Pedido Listo</p>
                <p className="text-sm text-muted-foreground">
                  Notificar cuando el pedido está listo
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.auto_order_ready || false}
              onCheckedChange={(checked) => updateSettings({ auto_order_ready: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium">Carrito Abandonado</p>
                <p className="text-sm text-muted-foreground">
                  Recordatorio para carritos abandonados
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.auto_abandoned_cart || false}
              onCheckedChange={(checked) => updateSettings({ auto_abandoned_cart: checked })}
            />
          </div>

          {settings?.auto_abandoned_cart && (
            <div className="pl-8 space-y-2">
              <Label>Enviar recordatorio después de</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-20"
                  value={settings?.abandoned_cart_delay_minutes || 30}
                  onChange={(e) => updateSettings({ abandoned_cart_delay_minutes: parseInt(e.target.value) || 30 })}
                  min={5}
                  max={1440}
                />
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Modal */}
      <WhatsAppConnectionModal
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
        onConnected={() => {
          // Refresh settings after connection
          refetch();
        }}
      />
    </div>
  );
};

export default WhatsAppConfig;
