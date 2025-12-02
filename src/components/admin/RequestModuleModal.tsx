import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Truck, Loader2, Check } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

interface RequestModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ModuleType = 'whatsapp' | 'delivery';

interface ModuleInfo {
  name: string;
  displayName: string;
  icon: typeof MessageSquare;
  description: string;
  monthlyPrice: number;
  features: string[];
}

const MODULES: Record<ModuleType, ModuleInfo> = {
  whatsapp: {
    name: 'whatsapp',
    displayName: 'WhatsApp Integration',
    icon: MessageSquare,
    description: 'Recibe órdenes directamente por WhatsApp y gestiona conversaciones con clientes',
    monthlyPrice: 15,
    features: [
      'Órdenes por WhatsApp',
      'Notificaciones automáticas',
      'Templates personalizables',
      'Gestión de conversaciones',
    ],
  },
  delivery: {
    name: 'delivery',
    displayName: 'Delivery Management',
    icon: Truck,
    description: 'Sistema completo de gestión de entregas con zonas, tarifas y seguimiento',
    monthlyPrice: 20,
    features: [
      'Zonas de entrega',
      'Cálculo de tarifas',
      'Seguimiento de pedidos',
      'Gestión de repartidores',
    ],
  },
};

export function RequestModuleModal({ open, onOpenChange }: RequestModuleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store } = useStore();
  const [selectedModule, setSelectedModule] = useState<ModuleType>('whatsapp');
  const [notes, setNotes] = useState<string>('');

  // Request module mutation
  const requestModuleMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) {
        throw new Error('Tienda no encontrada');
      }

      const module = MODULES[selectedModule];

      // Create a payment validation request for the module
      const { data, error } = await supabase.from('payment_validations').insert({
        store_id: store.id,
        plan_id: null, // null indica que es solicitud de módulo
        amount: module.monthlyPrice,
        proof_url: null,
        notes: `Solicitud de módulo: ${module.displayName}\n\n${notes}`,
        status: 'pending',
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Solicitud enviada',
        description: `Tu solicitud para el módulo ${MODULES[selectedModule].displayName} está siendo procesada.`,
      });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      onOpenChange(false);
      setNotes('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al enviar solicitud',
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    requestModuleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Solicitar Módulo Adicional</DialogTitle>
          <DialogDescription>
            Expande las funcionalidades de tu tienda con módulos especializados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Module Selection */}
          <div>
            <Label className="mb-3 block">Selecciona un módulo</Label>
            <RadioGroup
              value={selectedModule}
              onValueChange={(value) => setSelectedModule(value as ModuleType)}
            >
              {Object.entries(MODULES).map(([key, module]) => {
                const Icon = module.icon;
                return (
                  <div
                    key={key}
                    className={`
                      relative flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${selectedModule === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                    `}
                  >
                    <RadioGroupItem value={key} id={key} className="mt-1" />
                    <label htmlFor={key} className="flex-1 cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{module.displayName}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">${module.monthlyPrice}</p>
                          <p className="text-xs text-muted-foreground">/mes</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{module.description}</p>

                      <div className="flex flex-wrap gap-1">
                        {module.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="module-notes">
              Información adicional
              <span className="text-muted-foreground ml-1">(opcional)</span>
            </Label>
            <Textarea
              id="module-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Por qué necesitas este módulo? ¿Tienes alguna pregunta?"
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Information */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h4 className="font-semibold">¿Cómo funciona?</h4>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Envía tu solicitud de módulo (revisión en 24 horas)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Nuestro equipo te contactará con instrucciones de pago</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Una vez aprobado el pago, el módulo se activará automáticamente</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>Recibirás un tutorial de configuración del módulo</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-border">
              <p className="text-sm">
                <strong>Nota:</strong> Los módulos son cargos adicionales a tu plan base y se facturan mensualmente.
                Puedes cancelar en cualquier momento.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setNotes('');
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={requestModuleMutation.isPending}
          >
            {requestModuleMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitud'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
