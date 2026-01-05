import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlans } from '@/hooks/usePlans';
import { usePostHog } from '@/hooks/usePostHog';
import { useEffect, useState } from 'react';

export const PricingSection = () => {
  const navigate = useNavigate();
  const { plans: dbPlans, isLoading } = usePlans();
  const { track } = usePostHog();
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  // Track pricing section view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            track('pricing_section_viewed', {
              plans_count: dbPlans?.filter((p) => p.is_active).length || 0,
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );

    const element = document.getElementById('pricing');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [dbPlans, track]);

  // Transform DB plans to display format
  const plans =
    dbPlans
      ?.filter((plan) => plan.is_active)
      .map((plan, index) => {
        // Determine if this is the popular plan (typically the middle one or based on sort_order)
        const isPopular = index === 1 || plan.display_name.toLowerCase().includes('business');

        // Build features array from plan data
        const features = [
          ...(plan.features || []),
          ...(plan.modules?.whatsapp_monthly ? ['WhatsApp Transaccionales'] : []),
          ...(plan.modules?.delivery_monthly ? ['Gestión de delivery'] : []),
        ];

        // Determine CTA text based on plan price (freemium model)
        const isFree = plan.price_monthly === 0;
        const ctaText = isFree ? 'Crear Tienda Gratis' : 'Comenzar Ahora';

        return {
          name: plan.display_name,
          price: isFree ? 'Gratis' : `$${plan.price_monthly}`,
          period: isFree ? '' : '/mes',
          description: plan.description,
          features: features,
          cta: ctaText,
          popular: isPopular,
          badge: isPopular ? null : index === 0 ? null : 'Más Completo',
          planId: plan.id,
          isFree: isFree,
        };
      }) || [];

  // Loading skeleton
  if (isLoading) {
    return (
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto px-2 sm:px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="h-10 bg-muted rounded w-1/2 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-muted rounded w-2/3 mx-auto animate-pulse" />
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Fallback if no plans
  if (!plans || plans.length === 0) {
    return (
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">No hay planes disponibles en este momento.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Planes que se adaptan al tamaño y ritmo de tu negocio</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Empieza gratis, sin pagos iniciales ni datos bancarios. Elige un plan solo cuando lo necesites.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.planId}
              className={`relative bg-card rounded-lg border ${
                plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border hover:border-primary'
              } p-8 transition-all`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                  <span role="img" aria-label="Estrella">
                    ⭐
                  </span>{' '}
                  Más Popular
                </div>
              )}
              {plan.badge && !plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-4">
                {(expandedPlans[plan.planId] ? plan.features : plan.features.slice(0, 8)).map(
                  (feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ),
                )}
              </ul>

              {plan.features.length > 8 && (
                <button
                  onClick={() => {
                    setExpandedPlans((prev) => ({
                      ...prev,
                      [plan.planId]: !prev[plan.planId],
                    }));
                    track('pricing_features_toggled', {
                      plan_id: plan.planId,
                      plan_name: plan.name,
                      expanded: !expandedPlans[plan.planId],
                    });
                  }}
                  className="flex items-center gap-1 text-sm text-primary hover:underline mb-4 transition-colors"
                >
                  {expandedPlans[plan.planId] ? (
                    <>
                      Ver menos <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      Ver más características ({plan.features.length - 8}) <ChevronDown size={16} />
                    </>
                  )}
                </button>
              )}

              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => {
                  track('pricing_plan_clicked', {
                    plan_name: plan.name,
                    plan_price: plan.price,
                    plan_id: plan.planId,
                    is_popular: plan.popular,
                    is_free: plan.isFree,
                  });
                  navigate('/create-store', { state: { selectedPlanId: plan.planId } });
                }}
                aria-label={`${plan.cta} - Plan ${plan.name} ${plan.price}${plan.period}`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground">
            ¿Necesitas un plan personalizado?{' '}
            <button
              onClick={() => {
                track('custom_plan_requested', {
                  location: 'pricing_section',
                });
                navigate('/create-store');
              }}
              className="text-primary font-semibold hover:underline"
            >
              Contáctanos
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
