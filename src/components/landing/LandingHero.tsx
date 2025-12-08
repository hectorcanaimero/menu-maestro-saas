import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export const LandingHero = () => {
  const navigate = useNavigate();
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  // Parallax effects - different speeds for depth
  const yContent = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const yStats = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Digitaliza tu Negocio con{' '}
                <span className="text-primary">PideAI</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Crea tu catálogo digital, gestiona pedidos en tiempo real y aumenta tus
                ventas con nuestra plataforma todo-en-uno.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/create-store')}>
                Crear Tienda Gratis
                <ArrowRight className="ml-2" size={20} />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Iniciar Sesión
              </Button>
            </div>

            {/* Benefits */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 size={20} className="text-primary" />
                <span>Comienza gratis sin compromiso</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 size={20} className="text-primary" />
                <span>Configura tu tienda en minutos</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 size={20} className="text-primary" />
                <span>Gestiona pedidos en tiempo real</span>
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
