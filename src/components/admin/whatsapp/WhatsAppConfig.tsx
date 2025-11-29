import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Link2, 
  Key, 
  Phone, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Zap,
  ShoppingBag,
  PackageCheck,
  ShoppingCart,
  ExternalLink
} from "lucide-react";
import { useWhatsAppSettings } from "@/hooks/useWhatsAppSettings";
import { Separator } from "@/components/ui/separator";

const WhatsAppConfig = () => {
  const { settings, loading, testing, updateSettings, testConnection, disconnect } = useWhatsAppSettings();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    evolution_api_url: "",
    evolution_api_key: "",
    instance_name: "",
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local settings when settings load
  useState(() => {
    if (settings) {
      setLocalSettings({
        evolution_api_url: settings.evolution_api_url || "",
        evolution_api_key: settings.evolution_api_key || "",
        instance_name: settings.instance_name || "",
      });
    }
  });

  const handleChange = (field: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await updateSettings(localSettings);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleTestConnection = async () => {
    // First save the settings
    if (hasChanges) {
      await updateSettings(localSettings);
      setHasChanges(false);
    }
    // Then test connection
    await testConnection();
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando configuración...
      </div>
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

      {/* Evolution API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Evolution API
          </CardTitle>
          <CardDescription>
            Conecta tu instancia de Evolution API para enviar mensajes
            <a 
              href="https://doc.evolution-api.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
            >
              Documentación
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              URL de la API
            </Label>
            <Input
              placeholder="https://api.evolution.example.com"
              value={localSettings.evolution_api_url || settings?.evolution_api_url || ""}
              onChange={(e) => handleChange("evolution_api_url", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="Tu API Key de Evolution"
                value={localSettings.evolution_api_key || settings?.evolution_api_key || ""}
                onChange={(e) => handleChange("evolution_api_key", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Nombre de Instancia
            </Label>
            <Input
              placeholder="mi-tienda-whatsapp"
              value={localSettings.instance_name || settings?.instance_name || ""}
              onChange={(e) => handleChange("instance_name", e.target.value)}
            />
          </div>

          {/* Connection Status */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                Número conectado: {settings.connected_phone}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {hasChanges && (
              <Button onClick={handleSave}>
                Guardar Cambios
              </Button>
            )}
            <Button 
              variant={hasChanges ? "outline" : "default"}
              onClick={handleTestConnection}
              disabled={testing}
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
            {settings?.is_connected && (
              <Button variant="destructive" onClick={disconnect}>
                Desconectar
              </Button>
            )}
          </div>
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
    </div>
  );
};

export default WhatsAppConfig;
