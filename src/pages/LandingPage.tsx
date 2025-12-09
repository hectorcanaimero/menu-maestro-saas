import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHero } from '@/components/landing/LandingHero';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState, lazy, Suspense } from 'react';
import { usePostHog, useTrackScrollDepth } from '@/hooks/usePostHog';
import { SEO } from '@/components/SEO';

// Lazy load components below the fold for better performance
const HowItWorks = lazy(() => import('@/components/landing/HowItWorks').then(m => ({ default: m.HowItWorks })));
const Features = lazy(() => import('@/components/Features').then(m => ({ default: m.Features })));
const UseCases = lazy(() => import('@/components/landing/UseCases').then(m => ({ default: m.UseCases })));
const PricingSection = lazy(() => import('@/components/landing/PricingSection').then(m => ({ default: m.PricingSection })));
const TestimonialsSection = lazy(() => import('@/components/landing/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const TrustBadges = lazy(() => import('@/components/landing/TrustBadges').then(m => ({ default: m.TrustBadges })));
const FAQSection = lazy(() => import('@/components/landing/FAQSection').then(m => ({ default: m.FAQSection })));
const LandingFooter = lazy(() => import('@/components/landing/LandingFooter').then(m => ({ default: m.LandingFooter })));
const WhatsAppWidget = lazy(() => import('@/components/landing/WhatsAppWidget').then(m => ({ default: m.WhatsAppWidget })));
const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
const StickyCTA = lazy(() => import('@/components/landing/StickyCTA').then(m => ({ default: m.StickyCTA })));

// Loading skeleton component
const SectionSkeleton = () => (
  <div className="py-20 px-4">
    <div className="container mx-auto max-w-6xl">
      <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4 animate-pulse" />
      <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-12 animate-pulse" />
      <div className="grid md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { track, trackPageView } = usePostHog();
  const [whatsappMessage, setWhatsappMessage] = useState(
    '¡Hola! Me gustaría crear mi tienda con PideAI'
  );

  // Track page view on mount
  useEffect(() => {
    trackPageView('Landing Page', {
      page_type: 'landing',
      page_url: window.location.href,
    });
  }, [trackPageView]);

  // Track scroll depth
  useTrackScrollDepth();

  // Detectar sección visible para personalizar mensaje
  useEffect(() => {
    const handleScroll = () => {
      const pricingSection = document.getElementById('pricing');

      if (pricingSection) {
        const rect = pricingSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setWhatsappMessage('Hola, quiero información sobre los planes de PideAI');
          return;
        }
      }

      if (window.scrollY > 1000) {
        setWhatsappMessage('Hola, necesito ayuda para digitalizar mi restaurante');
      } else {
        setWhatsappMessage('¡Hola! Me gustaría crear mi tienda con PideAI');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO />
      <LandingHeader />
      <LandingHero />

      <Suspense fallback={<SectionSkeleton />}>
        {/* Features Section */}
        <section id="features">
          <Features />
        </section>

        <HowItWorks />
        <UseCases />
        <PricingSection />
        <TestimonialsSection />
        <TrustBadges />
        <FAQSection />

        {/* Final CTA */}
        <section className="py-20 px-4 bg-primary/5">
          <motion.div
            className="container mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para Digitalizar tu Negocio?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete a cientos de negocios que ya están creciendo con PideAI. Comienza gratis
              hoy mismo.
            </p>
            <Button
              size="lg"
              onClick={() => {
                track('final_cta_clicked', {
                  cta_location: 'bottom_section',
                  cta_text: 'Crear Tienda Gratis',
                });
                navigate('/create-store');
              }}
            >
              Crear Tienda Gratis
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </motion.div>
        </section>

        <LandingFooter />
      </Suspense>

      <Suspense fallback={null}>
        {/* WhatsApp Widget Flotante */}
        <WhatsAppWidget
          phoneNumber="573123456789"
          message={whatsappMessage}
          position="bottom-right"
        />

        {/* Exit Intent Popup */}
        <ExitIntentPopup />

        {/* Sticky CTA Bar */}
        <StickyCTA />
      </Suspense>
    </div>
  );
};

export default LandingPage;
