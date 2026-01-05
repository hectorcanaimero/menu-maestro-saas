import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, ShoppingBag, PackageCheck, ShoppingCart, Megaphone, Save, Info } from 'lucide-react';
import { useWhatsAppTemplates, TEMPLATE_VARIABLES, WhatsAppTemplate } from '@/hooks/useWhatsAppTemplates';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TEMPLATE_INFO = {
  order_confirmation: {
    icon: ShoppingBag,
    title: 'Confirmación de Pedido',
    description: 'Se envía automáticamente cuando se crea un nuevo pedido',
    color: 'text-blue-500',
  },
  order_ready: {
    icon: PackageCheck,
    title: 'Pedido Listo',
    description: "Se envía cuando el pedido cambia a estado 'Listo'",
    color: 'text-green-500',
  },
  abandoned_cart: {
    icon: ShoppingCart,
    title: 'Carrito Abandonado',
    description: 'Recordatorio para clientes que no completaron su compra',
    color: 'text-orange-500',
  },
  // promotion: {
  //   icon: Megaphone,
  //   title: "Promoción General",
  //   description: "Plantilla base para campañas promocionales",
  //   color: "text-purple-500",
  // },
};

const WhatsAppTemplates = () => {
  const { templates, loading, updateTemplate, toggleTemplate } = useWhatsAppTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingId(template.id);
    setEditContent(template.message_body);
  };

  const handleSave = async (templateId: string) => {
    setSaving(true);
    const success = await updateTemplate(templateId, { message_body: editContent });
    if (success) {
      setEditingId(null);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando plantillas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Personaliza los mensajes que se envían automáticamente a tus clientes. Usa las variables entre llaves para
          incluir información dinámica.
        </p>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => {
          const info = TEMPLATE_INFO[template.template_type as keyof typeof TEMPLATE_INFO];
          const Icon = info?.icon || FileText;
          const isEditing = editingId === template.id;

          return (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${info?.color || ''}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{info?.title || template.template_name}</CardTitle>
                      <CardDescription>{info?.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        <TooltipProvider>
                          {TEMPLATE_VARIABLES[template.template_type]?.map((variable) => (
                            <Tooltip key={variable}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => setEditContent((prev) => prev + variable)}
                                >
                                  {variable}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clic para insertar</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleSave(template.id)} disabled={saving}>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm whitespace-pre-wrap">
                      {template.message_body}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {TEMPLATE_VARIABLES[template.template_type]?.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                        Editar Plantilla
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WhatsAppTemplates;
