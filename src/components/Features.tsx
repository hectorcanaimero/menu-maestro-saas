import { QrCode, Smartphone, Zap, BarChart3, Globe, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: QrCode,
    title: "Códigos QR",
    description: "Genera códigos QR personalizados para cada mesa. Tus clientes acceden al menú instantáneamente.",
  },
  {
    icon: Smartphone,
    title: "100% Móvil",
    description: "Diseño responsive perfecto en cualquier dispositivo. Experiencia fluida garantizada.",
  },
  {
    icon: Zap,
    title: "Actualizaciones Instantáneas",
    description: "Modifica precios, platillos y descripciones en tiempo real sin reimprimir menús.",
  },
  {
    icon: BarChart3,
    title: "Analytics Avanzados",
    description: "Conoce qué platillos son más populares y optimiza tu oferta gastronómica.",
  },
  {
    icon: Globe,
    title: "Multi-idioma",
    description: "Presenta tu menú en múltiples idiomas automáticamente para clientes internacionales.",
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Protección de datos empresariales con cifrado de nivel bancario.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-gradient-elegant">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Todo lo que{" "}
            <span className="bg-gradient-gold bg-clip-text text-transparent">
              Necesitas
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Herramientas profesionales diseñadas específicamente para restaurantes modernos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group p-8 hover:shadow-gold transition-all duration-300 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-gold">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
