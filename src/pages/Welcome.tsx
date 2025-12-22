import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DollarSign, Smartphone, Clock, ChefHat } from "lucide-react";
import posthog from "posthog-js";
import { useEffect } from "react";

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Track landing page view
    posthog.capture('landing_page_viewed');

    // Setup intersection observer for section views
    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px'
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id || 'unknown';
          posthog.capture('landing_section_viewed', {
            section: sectionId
          });
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all main sections
    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleCTAClick = (ctaType: string) => {
    posthog.capture('landing_cta_clicked', {
      cta_type: ctaType,
      section: ctaType.includes('hero') ? 'hero' : 'final'
    });
  };

  const features = [
    {
      icon: DollarSign,
      title: "0% de Comisión",
      description: "Todos los pedidos son 100% tuyos. Sin sorpresas, sin letra chica.",
      metric: "Ahorra hasta $50K/año"
    },
    {
      icon: Smartphone,
      title: "Tu Dominio, Tu Marca",
      description: "turestaurante.pideai.com personalizado. Tus clientes piden directo a ti.",
      metric: "Dueño de tus datos"
    },
    {
      icon: Clock,
      title: "Activo en Minutos",
      description: "Carga tu menú, configura zonas de entrega y empieza a vender. Sin instalaciones.",
      metric: "Setup en 15 minutos"
    },
    {
      icon: ChefHat,
      title: "Panel de Control Total",
      description: "Gestiona menú, pedidos, clientes y estadísticas desde un solo lugar.",
      metric: "Sin llamar a soporte"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Tu tienda de pedidos online.{" "}
            <span className="text-primary">Sin comisiones del 30%.</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Restaurantes como el tuyo ahorran hasta $50,000 MXN al año
            dejando apps de delivery. Crea tu tienda en 15 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => {
                handleCTAClick('hero_crear_tienda');
                navigate("/create-store");
              }}
              className="flex flex-col sm:flex-row items-center gap-1"
            >
              <span>Crear Mi Tienda Gratis</span>
              <span className="text-xs opacity-80">Sin tarjeta de crédito</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                handleCTAClick('hero_iniciar_sesion');
                navigate("/auth");
              }}
            >
              Iniciar Sesión
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            ✓ Más de 500 restaurantes ya venden con PideAI
          </p>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y bg-muted/20 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Confiado por restaurantes en toda América Latina
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-center">
              <p className="text-2xl font-bold">500+</p>
              <p className="text-xs text-muted-foreground">Restaurantes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">50K+</p>
              <p className="text-xs text-muted-foreground">Pedidos/mes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">4.8★</p>
              <p className="text-xs text-muted-foreground">Satisfacción</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">15 min</p>
              <p className="text-xs text-muted-foreground">Setup promedio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Todo lo que necesitas. Nada de lo que no.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Las plataformas de delivery se quedan con 30% de cada venta.
            PideAI te da el control sin comisiones.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
                onMouseEnter={() => {
                  posthog.capture('feature_card_hovered', {
                    feature_title: feature.title,
                    feature_index: index
                  });
                }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {feature.description}
                </p>
                <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {feature.metric}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6 p-8 rounded-lg border bg-card">
          <div className="inline-block text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">
            🎉 Primeros 100 restaurantes tienen soporte prioritario de por vida
          </div>

          <h2 className="text-3xl font-bold">
            Deja de regalar 30% de tus ventas
          </h2>

          <p className="text-lg text-muted-foreground">
            Más de <span className="font-semibold text-foreground">500 restaurantes</span> ya
            recuperaron el control de sus pedidos. Es tu turno.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => {
                handleCTAClick('final_crear_tienda');
                navigate("/create-store");
              }}
            >
              Crear Mi Tienda Gratis
              <span className="ml-2">→</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                handleCTAClick('final_ver_demo');
                // Scroll to features or add demo section
                document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Ver Más Detalles
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            ✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ Cancela cuando quieras &nbsp;·&nbsp; ✓ Soporte en español
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PideAI. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
