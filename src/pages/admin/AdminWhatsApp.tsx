import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, Megaphone, Settings, Sparkles } from 'lucide-react';
import { useWhatsAppSettings } from '@/hooks/useWhatsAppSettings';
import WhatsAppDashboard from '@/components/admin/whatsapp/WhatsAppDashboard';
import WhatsAppTemplates from '@/components/admin/whatsapp/WhatsAppTemplates';
import WhatsAppCampaigns from '@/components/admin/whatsapp/WhatsAppCampaigns';
import WhatsAppConfig from '@/components/admin/whatsapp/WhatsAppConfig';

const AdminWhatsApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { settings, loading } = useWhatsAppSettings();

  const getStatusBadge = () => {
    if (loading) return null;

    if (!settings?.is_enabled) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }

    if (settings?.is_connected) {
      return <Badge className="bg-green-500 hover:bg-green-600">Conectado</Badge>;
    }

    return <Badge variant="destructive">Desconectado</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <MessageSquare className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">WhatsApp Notificaciones</h2>
              </div>
              <p className="text-sm text-muted-foreground">Automatiza la comunicación con tus clientes</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Plantillas</span>
            </TabsTrigger>
            {/* <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Campañas</span>
            </TabsTrigger> */}
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuración</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <WhatsAppDashboard />
          </TabsContent>

          <TabsContent value="templates">
            <WhatsAppTemplates />
          </TabsContent>

          {/* <TabsContent value="campaigns">
            <WhatsAppCampaigns />
          </TabsContent> */}

          <TabsContent value="config">
            <WhatsAppConfig />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsApp;
