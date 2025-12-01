import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleNotAvailableProps {
  module: string;
  description?: string;
}

/**
 * Componente que muestra cuando un módulo no está disponible en el plan actual
 * Ofrece opciones para contactar soporte o ver planes
 */
export function ModuleNotAvailable({ module, description }: ModuleNotAvailableProps) {
  const defaultDescriptions: Record<string, string> = {
    WhatsApp: 'Las notificaciones automáticas por WhatsApp están disponibles en planes premium.',
    Delivery: 'El sistema de delivery con motoristas está disponible en planes premium.',
  };

  const moduleDescription = description || defaultDescriptions[module] || `El módulo ${module} no está disponible en tu plan actual.`;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Módulo {module} No Disponible</CardTitle>
          <CardDescription className="text-base mt-2">
            {moduleDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Este módulo puede ser habilitado por el administrador de la plataforma
              después de validar tu pago.
            </p>
          </div>

          <div className="space-y-2">
            <Button className="w-full" size="lg" asChild>
              <Link to="/admin/settings?tab=subscription">
                <Zap className="mr-2 h-4 w-4" />
                Ver Planes y Precios
              </Link>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <a
                href="https://wa.me/1234567890?text=Hola,%20me%20gustaría%20habilitar%20el%20módulo%20de%20"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contactar Soporte
              </a>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            ¿Tienes preguntas? Nuestro equipo de soporte está disponible para ayudarte
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
