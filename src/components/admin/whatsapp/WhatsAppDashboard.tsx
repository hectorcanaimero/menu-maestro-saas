import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  CheckCircle2, 
  Eye, 
  XCircle, 
  CreditCard,
  Clock,
  User,
  Phone
} from "lucide-react";
import { useWhatsAppCredits } from "@/hooks/useWhatsAppCredits";
import { useWhatsAppMessages, MessageStats } from "@/hooks/useWhatsAppMessages";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const WhatsAppDashboard = () => {
  const { credits, loading: creditsLoading, getUsagePercentage } = useWhatsAppCredits();
  const { messages, loading: messagesLoading, getMonthlyStats } = useWhatsAppMessages();
  const [monthlyStats, setMonthlyStats] = useState<MessageStats | null>(null);

  useEffect(() => {
    const loadMonthlyStats = async () => {
      const stats = await getMonthlyStats();
      setMonthlyStats(stats);
    };
    loadMonthlyStats();
  }, [getMonthlyStats]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'read':
        return <Eye className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'sent': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'read': return 'Leído';
      case 'failed': return 'Fallido';
      default: return status;
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'order_confirmation': return 'Confirmación';
      case 'order_ready': return 'Pedido Listo';
      case 'abandoned_cart': return 'Carrito';
      case 'promotion': return 'Promoción';
      case 'campaign': return 'Campaña';
      case 'manual': return 'Manual';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats?.delivered || 0}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats?.total ? Math.round((monthlyStats.delivered / monthlyStats.total) * 100) : 0}% tasa de entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leídos</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats?.read || 0}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats?.delivered ? Math.round((monthlyStats.read / monthlyStats.delivered) * 100) : 0}% tasa de lectura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats?.total ? Math.round((monthlyStats.failed / monthlyStats.total) * 100) : 0}% tasa de error
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credits Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Créditos del Mes
              </CardTitle>
              <CardDescription>
                50 mensajes incluidos, extras a $0.05 c/u
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Comprar Créditos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Usados este mes</span>
              <span className="font-medium">
                {credits?.credits_used || 0} / {credits?.monthly_credits || 50}
              </span>
            </div>
            <Progress value={getUsagePercentage()} className="h-2" />
          </div>
          
          {credits?.extra_credits ? (
            <div className="flex items-center justify-between text-sm border-t pt-4">
              <span>Créditos extra disponibles</span>
              <Badge variant="secondary">{credits.extra_credits}</Badge>
            </div>
          ) : null}

          <div className="flex items-center justify-between text-sm border-t pt-4">
            <span className="font-medium">Total disponible</span>
            <span className="text-lg font-bold text-green-600">
              {credits?.credits_available || 50}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Mensajes</CardTitle>
          <CardDescription>Historial de mensajes enviados</CardDescription>
        </CardHeader>
        <CardContent>
          {messagesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando mensajes...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay mensajes enviados aún
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {messages.slice(0, 20).map((message) => (
                  <div
                    key={message.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(message.status)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {message.customer_name || 'Cliente'}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {message.customer_phone}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.message_content}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                          {getMessageTypeLabel(message.message_type)}
                        </Badge>
                        <span className="text-muted-foreground">
                          {getStatusLabel(message.status)}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppDashboard;
