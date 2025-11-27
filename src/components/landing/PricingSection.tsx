import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PricingSection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Gratis',
      price: '$0',
      description: 'Perfecto para empezar',
      features: [
        'Catálogo digital ilimitado',
        'Gestión de pedidos básica',
        '50 pedidos/mes',
        'Panel de administración',
        'Soporte por email',
      ],
      cta: 'Comenzar Gratis',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$29',
      description: 'Para negocios en crecimiento',
      features: [
        'Todo en Gratis, más:',
        'Pedidos ilimitados',
        'Panel de cocina',
        'Reportes y analytics',
        'Códigos QR personalizados',
        'Múltiples métodos de pago',
        'Soporte prioritario 24/7',
      ],
      cta: 'Comenzar Prueba Gratis',
      popular: true,
    },
    {
      name: 'Business',
      price: '$99',
      description: 'Para equipos y múltiples locales',
      features: [
        'Todo en Pro, más:',
        'Múltiples tiendas',
        'Gestión de usuarios y roles',
        'API personalizada',
        'Integraciones avanzadas',
        'Manager dedicado',
        'Capacitación personalizada',
      ],
      cta: 'Contactar Ventas',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Precios Simples y Claros</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige el plan perfecto para tu negocio. Todos los planes incluyen 14 días de
            prueba gratis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card rounded-lg border ${
                plan.popular
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border hover:border-primary'
              } p-8 transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Más Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => navigate('/create-store')}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
