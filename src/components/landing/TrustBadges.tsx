import { Shield, Lock, CreditCard, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: 'Tu Negocio Protegido',
      description: 'Datos y ventas siempre respaldados',
    },
    {
      icon: Lock,
      title: 'Datos Seguros',
      description: 'Protección y buenas prácticas de seguridad.',
    },
    {
      icon: CreditCard,
      title: 'Sin Comisiones',
      description: 'Lo que vendes es tuyo.',
    },
    {
      icon: CheckCircle2,
      title: 'Planes flexibles',
      description: 'Crece a tu ritmo, sin ataduras.',
    },
  ];

  return (
    <section className="py-12 px-4 border-t border-border bg-background">
      <div className="container mx-auto px-2 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon size={24} className="text-primary" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">{badge.title}</div>
                  <div className="text-xs text-muted-foreground">{badge.description}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
