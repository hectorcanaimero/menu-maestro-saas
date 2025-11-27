import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHero } from '@/components/landing/LandingHero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PricingSection } from '@/components/landing/PricingSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Features } from '@/components/Features';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <LandingHero />
      
      {/* Features Section */}
      <section id="features">
        <Features />
      </section>

      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
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
          <Button size="lg" onClick={() => navigate('/create-store')}>
            Crear Tienda Gratis
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </motion.div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
