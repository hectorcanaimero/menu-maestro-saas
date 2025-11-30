import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Calendar, 
  Users, 
  Send, 
  XCircle,
  Clock,
  CheckCircle2,
  Trash2,
  Eye
} from "lucide-react";
import { useWhatsAppCampaigns, WhatsAppCampaign } from "@/hooks/useWhatsAppCampaigns";
import { useWhatsAppCredits } from "@/hooks/useWhatsAppCredits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const WhatsAppCampaigns = () => {
  const { campaigns, loading, createCampaign, cancelCampaign, deleteCampaign } = useWhatsAppCampaigns();
  const { credits } = useWhatsAppCredits();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState<{
    name: string;
    message_body: string;
    image_url: string;
    target_audience: 'all' | 'recent_customers' | 'inactive_customers';
    scheduled_at: string;
    total_recipients: number;
    status: 'draft';
  }>({
    name: "",
    message_body: "",
    image_url: "",
    target_audience: "all",
    scheduled_at: "",
    total_recipients: 0,
    status: "draft",
  });

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message_body) return;

    const campaign = await createCampaign({
      ...newCampaign,
      scheduled_at: newCampaign.scheduled_at || null,
    });

    if (campaign) {
      setIsDialogOpen(false);
      setNewCampaign({
        name: "",
        message_body: "",
        image_url: "",
        target_audience: "all",
        scheduled_at: "",
        total_recipients: 0,
        status: "draft",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Programada</Badge>;
      case 'sending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Enviando</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all': return 'Todos los clientes';
      case 'recent_customers': return 'Clientes recientes';
      case 'inactive_customers': return 'Clientes inactivos';
      default: return audience;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando campañas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Campañas Promocionales</h3>
          <p className="text-sm text-muted-foreground">
            Envía mensajes masivos a tus clientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Campaña</DialogTitle>
              <DialogDescription>
                Configura tu campaña promocional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre de la campaña</Label>
                <Input
                  placeholder="Ej: Promoción de Navidad"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensaje</Label>
                <Textarea
                  placeholder="Escribe tu mensaje promocional..."
                  rows={4}
                  value={newCampaign.message_body}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, message_body: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>URL de imagen (opcional)</Label>
                <Input
                  placeholder="https://..."
                  value={newCampaign.image_url}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, image_url: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Audiencia</Label>
                <Select
                  value={newCampaign.target_audience}
                  onValueChange={(value: 'all' | 'recent_customers' | 'inactive_customers') => setNewCampaign(prev => ({ ...prev, target_audience: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    <SelectItem value="recent_customers">Clientes recientes (últimos 30 días)</SelectItem>
                    <SelectItem value="inactive_customers">Clientes inactivos (+30 días sin comprar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Programar envío (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={newCampaign.scheduled_at}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduled_at: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Deja vacío para enviar manualmente
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateCampaign}
                disabled={!newCampaign.name || !newCampaign.message_body}
              >
                Crear Campaña
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credits Warning */}
      {credits && credits.credits_available < 10 && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Te quedan pocos créditos ({credits.credits_available}). 
            Considera comprar créditos extras antes de enviar una campaña.
          </p>
        </div>
      )}

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay campañas</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera campaña para enviar mensajes promocionales a tus clientes
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Campaña
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      {getAudienceLabel(campaign.target_audience)}
                      {campaign.total_recipients > 0 && (
                        <span>• {campaign.total_recipients} destinatarios</span>
                      )}
                    </CardDescription>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {campaign.message_body}
                </p>

                {/* Stats */}
                {campaign.status === 'completed' || campaign.status === 'sending' ? (
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <div className="text-lg font-bold">{campaign.messages_sent}</div>
                      <div className="text-xs text-muted-foreground">Enviados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{campaign.messages_delivered}</div>
                      <div className="text-xs text-muted-foreground">Entregados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-destructive">{campaign.messages_failed}</div>
                      <div className="text-xs text-muted-foreground">Fallidos</div>
                    </div>
                  </div>
                ) : null}

                {/* Scheduled Info */}
                {campaign.scheduled_at && campaign.status === 'scheduled' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Programada para: {format(new Date(campaign.scheduled_at), "PPp", { locale: es })}
                  </div>
                )}

                {/* Created Info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Creada {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true, locale: es })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  {campaign.status === 'draft' && (
                    <>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Vista Previa
                      </Button>
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Ahora
                      </Button>
                    </>
                  )}
                  {campaign.status === 'scheduled' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => cancelCampaign(campaign.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                  {(campaign.status === 'completed' || campaign.status === 'cancelled') && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteCampaign(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsAppCampaigns;
