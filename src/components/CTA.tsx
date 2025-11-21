import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const benefits = [
  "Sin tarjeta de crédito requerida",
  "Configuración en menos de 5 minutos",
  "Soporte técnico 24/7",
  "Cancela cuando quieras",
];

export const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-elegant opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            ¿Listo para{" "}
            <span className="bg-gradient-gold bg-clip-text text-transparent">
              Transformar
            </span>{" "}
            tu Restaurante?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12">
            Únete a cientos de restaurantes que ya digitalizaron sus menús
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="group bg-gradient-gold hover:shadow-gold transition-all duration-300 text-lg px-10 h-14"
            >
              Comenzar Ahora
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 hover:border-primary text-lg px-10 h-14"
            >
              Hablar con Ventas
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground justify-center"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
