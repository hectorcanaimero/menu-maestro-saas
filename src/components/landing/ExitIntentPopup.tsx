import { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePostHog } from '@/hooks/usePostHog';

export const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const navigate = useNavigate();
  const { track } = usePostHog();

  useEffect(() => {
    // Check if user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem('exitIntentShown');
    if (hasSeenPopup) {
      setHasShown(true);
      return;
    }
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is leaving from the top of the page
      if (e.clientY <= 10 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem('exitIntentShown', 'true');
        track('exit_intent_shown', {
          trigger: 'mouse_leave',
          time_on_page: Math.round(performance.now() / 1000),
        });
      }
    };

    // Add delay to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  const handleClose = () => {
    track('exit_intent_dismissed', {
      time_shown: Math.round(performance.now() / 1000),
    });
    setIsVisible(false);
  };

  const handleCTA = () => {
    track('exit_intent_converted', {
      cta_text: 'Crear Mi Tienda Gratis',
      destination: '/auth?mode=signup',
    });
    setIsVisible(false);
    navigate('/auth?mode=signup');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Popup */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.9, y: '-45%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-45%' }}
            transition={{ type: 'spring', duration: 0.5 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-intent-title"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 relative overflow-hidden">
              {/* Close button */}
              {/* <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button> */}

              {/* Decorative gradient */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl"
                aria-hidden="true"
              />

              {/* Content */}
              <div className="relative space-y-6">
                {/* Icon */}
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Sparkles size={32} className="text-primary" aria-hidden="true" />
                </div>

                {/* Text */}
                <div>
                  <h3 id="exit-intent-title" className="text-2xl font-bold mb-2">
                    ¡Espera! Empieza gratis sin pagar nada
                  </h3>
                  <p className="text-muted-foreground">
                    Crea tu tienda ahora y comienza a recibir
                    <span className="font-bold text-primary"> pedidos sin costo inicial</span>. No pedimos tarjeta, no
                    cobramos automáticamente y tú decides si continuar.
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" aria-hidden="true" />
                    <span>Lista tu tienda en menos de 5 minutos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" aria-hidden="true" />
                    <span>Pedidos claros y sin comisión</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" aria-hidden="true" />
                    <span>Cancela o continúa cuando tú quieras</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <Button size="lg" className="w-full" onClick={handleCTA} aria-label="Crear tienda gratis ahora">
                    Crear mi tienda gratis
                    <ArrowRight className="ml-2" size={20} aria-hidden="true" />
                  </Button>
                  <button
                    onClick={handleClose}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Continuar navegando"
                  >
                    Seguir explorando
                  </button>
                </div>

                {/* Trust indicator */}
                <p className="text-xs text-center text-muted-foreground">
                  <span className="font-semibold text-foreground">Más de 500 negocios</span> ya usan PideAí para ordenar
                  sus pedidos
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
