import { Store, Palette, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export const HowItWorks = () => {
  const steps = [
    {
      icon: Store,
      title: 'Crea tu Tienda',
      description: 'Regístrate y configura tu negocio con tu logo, colores y datos básicos.',
    },
    {
      icon: Palette,
      title: 'Arma tu tienda',
      description: 'Agrega productos, precios, extras y categorías de forma sencilla.',
    },
    {
      icon: ShoppingCart,
      title: 'Recibe Pedidos',
      description: 'Comparte tu link o QR y comienza a recibir pedidos organizados en tiempo real.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto px-2 sm:px-6 lg:px-12">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Cómo Funciona</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Empieza a recibir pedidos en solo 3 pasos</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                className="relative bg-card p-8 rounded-lg border border-border hover:border-primary transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                  {index + 1}
                </div>
                <Icon size={48} className="text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
