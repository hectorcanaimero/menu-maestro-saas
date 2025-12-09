import { MessageCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from '@/hooks/usePostHog';

interface WhatsAppWidgetProps {
  phoneNumber?: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export const WhatsAppWidget = ({
  phoneNumber = '573123456789', // Número por defecto (Colombia)
  message = '¡Hola! Me gustaría crear mi tienda con PideAI',
  position = 'bottom-right',
}: WhatsAppWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { track } = usePostHog();

  // Track widget shown
  useEffect(() => {
    track('whatsapp_widget_shown', {
      position,
      default_message: message,
    });
  }, [track, position, message]);

  const handleClick = () => {
    track('whatsapp_widget_clicked', {
      position,
      message,
      phone_number: phoneNumber,
    });

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setHasInteracted(true);
  };

  const toggleTooltip = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);

    if (newOpenState) {
      track('whatsapp_widget_opened', {
        position,
      });
    }

    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  const tooltipPositionClasses = {
    'bottom-right': 'bottom-20 right-0',
    'bottom-left': 'bottom-20 left-0',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50`}
      role="complementary"
      aria-label="Widget de contacto por WhatsApp"
    >
      {/* Tooltip */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute ${tooltipPositionClasses[position]} mb-2 w-64 bg-card border border-border rounded-lg shadow-lg p-4`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={toggleTooltip}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar mensaje"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <MessageCircle size={20} className="text-primary-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">¿Necesitas ayuda?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Chatea con nosotros por WhatsApp. Te respondemos en minutos.
                </p>
                <button
                  onClick={handleClick}
                  className="w-full bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                  aria-label="Iniciar chat en WhatsApp"
                >
                  Iniciar Chat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={toggleTooltip}
        className="w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
        aria-label="Abrir chat de WhatsApp"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} aria-hidden="true" />
            </motion.div>
          ) : (
            <motion.div
              key="message"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle size={24} aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Badge */}
        {!hasInteracted && (
          <motion.span
            className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, type: 'spring' }}
            aria-hidden="true"
          />
        )}

        {/* Pulse Animation */}
        {!hasInteracted && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" aria-hidden="true" />
        )}
      </motion.button>
    </div>
  );
};
