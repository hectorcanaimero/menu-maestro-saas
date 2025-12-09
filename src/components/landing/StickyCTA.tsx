import { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const StickyCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling past hero section (approx 800px)
      // Hide when reaching footer (within 300px of bottom)
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const distanceFromBottom = documentHeight - (scrollY + windowHeight);

      if (!isDismissed) {
        setIsVisible(scrollY > 800 && distanceFromBottom > 300);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleCTA = () => {
    navigate('/create-store');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-2xl"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          role="complementary"
          aria-label="Barra de llamado a la acción"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm md:text-base truncate">
                  ¿Listo para digitalizar tu negocio?
                </p>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  <span className="font-semibold text-primary">30 días gratis</span> • Sin tarjeta de crédito
                </p>
              </div>

              {/* CTA Button */}
              <Button
                size="sm"
                onClick={handleCTA}
                className="flex-shrink-0"
                aria-label="Crear tienda gratis desde barra sticky"
              >
                <span className="hidden sm:inline">Crear Tienda Gratis</span>
                <span className="sm:hidden">Comenzar</span>
                <ArrowRight className="ml-2" size={16} aria-hidden="true" />
              </Button>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"
                aria-label="Cerrar barra"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Progress indicator (optional) */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            aria-hidden="true"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
