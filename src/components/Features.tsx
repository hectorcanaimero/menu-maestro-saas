import { QrCode, MessageCircle, Percent, Tag, Truck, BarChart3, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: QrCode,
    title: 'Códigos QR',
    description: 'Genera códigos QR personalizados para cada mesa. Tus clientes acceden al menú instantáneamente.',
  },
  {
    icon: MessageCircle,
    title: 'Integración WhatsApp',
    description: 'Recibe pedidos directamente por WhatsApp con plantillas automáticas y notificaciones en tiempo real.',
  },
  {
    icon: DollarSign,
    title: 'Conversión de Monedas',
    description:
      'Conversión automática EUR/USD a bolívares venezolanos (VES) con tasas del BCV actualizadas cada hora. Configura tasas manuales si lo prefieres.',
  },
  {
    icon: Percent,
    title: 'Cupones de Descuento',
    description: 'Crea cupones personalizados con porcentaje o monto fijo. Controla validez y usos por cliente.',
  },
  {
    icon: Tag,
    title: 'Promociones',
    description: 'Configura promociones automáticas: 2x1, descuentos por categoría, ofertas especiales y más.',
  },
  // {
  //   icon: Truck,
  //   title: 'Gestión de Delivery',
  //   description: 'Administra zonas de entrega, asigna repartidores y rastrea pedidos en tiempo real con GPS.',
  // },
  {
    icon: BarChart3,
    title: 'Analytics Avanzados',
    description: 'Dashboard completo con ventas, productos populares, clientes frecuentes y métricas clave.',
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4 bg-primary/5">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Todo lo que Necesitas</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Herramientas profesionales diseñadas específicamente para restaurantes modernos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 h-full hover:border-primary transition-all duration-300 bg-card border-border"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
