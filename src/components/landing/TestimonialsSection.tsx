import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'César Cegarra',
      business: 'Sushi House',
      role: 'Gerente General',
      content:
        'Aumentamos nuestras ventas en un 40% en el primer mes. Los pedidos por WhatsApp son claros y organizados. Ya no perdemos tiempo tomando órdenes por teléfono.',
      rating: 5,
      metric: '+40% ventas',
    },
    {
      name: 'María González',
      business: 'Pizzería Napolitana',
      role: 'Propietaria',
      content:
        'El mejor cambio que hicimos. Ahora los clientes ven fotos de nuestras pizzas y siempre ordenan extras. La inversión se pagó sola en 2 semanas.',
      rating: 5,
      metric: 'ROI en 2 semanas',
    },
    {
      name: 'Roberto Díaz',
      business: 'Café Central',
      role: 'Administrador',
      content:
        'Configuramos todo en 30 minutos. El código QR en las mesas eliminó las filas y mejoramos la experiencia del cliente. Nuestros meseros ahora se enfocan en servicio.',
      rating: 5,
      metric: 'Setup en 30 min',
    },
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto px-2 sm:px-6 lg:px-12">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo Que Dicen Nuestros Clientes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Miles de negocios confían en PideAí para digitalizar sus operaciones
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} className="fill-primary text-primary" aria-hidden="true" />
                  ))}
                </div>
                {testimonial.metric && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {testimonial.metric}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-6 italic leading-relaxed">"{testimonial.content}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg" aria-hidden="true">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  <div className="text-xs text-muted-foreground font-medium">{testimonial.business}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
