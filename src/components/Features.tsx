import { QrCode, MessageCircle, Percent, Tag, Truck, BarChart3, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: QrCode,
    title: 'Códigos QR',
    description:
      'Genera códigos QR personalizados para mesas, mostrador o delivery y deja que tus clientes vean el menú y pidan sin preguntar.',
  },
  {
    icon: MessageCircle,
    title: 'Integración WhatsApp',
    description: 'Los pedidos llegan organizados por WhatsApp, con notificaciones claras según el estado de la orden.',
  },
  {
    icon: DollarSign,
    title: 'Conversión de Monedas',
    description:
      'Muestra precios en dólares con conversión automática a bolívares según la tasa BCV o manuales, sin dolores de cabeza.',
  },
  {
    icon: Percent,
    title: 'Cupones de Descuento',
    description: 'Crea cupones para atraer más clientes, controlar promociones y aumentar la recompra.',
  },
  {
    icon: Tag,
    title: 'Promociones',
    description: 'Activa ofertas por categorías, combos o productos especiales en pocos clics.',
  },
  // {
  //   icon: Truck,
  //   title: 'Gestión de Delivery',
  //   description: 'Administra zonas de entrega, asigna repartidores y rastrea pedidos en tiempo real con GPS.',
  // },
  {
    icon: BarChart3,
    title: 'Analíticas',
    description: 'Visualiza qué vendes más, cuándo y a quién, para tomar mejores decisiones.',
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4 bg-primary/5">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Haz que pedir en tu negocio sea fácil para tus clientes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Herramientas pensadas para que tus clientes pidan mejor y tú trabajes con más tranquilidad.
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
