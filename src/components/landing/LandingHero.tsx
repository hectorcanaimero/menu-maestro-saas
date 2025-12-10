import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

export const LandingHero = () => {
  const navigate = useNavigate();
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Parallax effects - different speeds for depth (disabled on mobile and reduced motion)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const disableParallax = shouldReduceMotion || isMobile;

  const yContent = useTransform(scrollYProgress, [0, 1], [0, disableParallax ? 0 : -50]);
  const yStats = useTransform(scrollYProgress, [0, 1], [0, disableParallax ? 0 : 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, disableParallax ? 1 : 0]);

  return (
    <section ref={ref} className="pt-32 pb-20 px-4 relative overflow-hidden">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ y: yContent, opacity }}
          >
            {/* Trust Badge - Plan Gratuito */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-semibold text-primary">
                <span role="img" aria-label="Celebración">
                  🎉
                </span>{' '}
                Plan Gratuito Disponible
              </span>
              <span className="text-sm text-muted-foreground">• Sin tarjeta de crédito</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Pedidos Fáciles y Rápidos con <span className="text-primary">WhatsApp</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Crea tu menú digital en minutos y recibe pedidos por WhatsApp.{' '}
                <span className="font-bold text-foreground">Solo $1 al día</span> con{' '}
                <span className="font-bold text-primary">0% de comisión</span> en tus ventas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/create-store')}
                aria-label="Crear tienda gratis - Inicia tu prueba de 30 días sin tarjeta de crédito"
              >
                Crear Tienda Gratis
                <ArrowRight className="ml-2" size={20} aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                aria-label="Iniciar sesión en tu cuenta existente"
              >
                Iniciar Sesión
              </Button>
            </div>

            {/* Benefits */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 size={20} className="text-primary" />
                <span className="font-medium">Plan gratuito disponible • Planes de pago desde $1 al día</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 size={20} className="text-primary" />
                <span>Listo en menos de 5 minutos</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 size={20} className="text-primary" />
                <span>Sin esperas • Sin filas • Sin papel</span>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ y: yStats, opacity }}
          >
            <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-colors">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Restaurantes Activos</div>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-colors">
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Pedidos Procesados</div>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-colors">
              <div className="text-3xl font-bold text-primary mb-2">99%</div>
              <div className="text-muted-foreground">Satisfacción</div>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-colors">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Soporte</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
