import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'María González',
      business: 'Restaurante La Esquina',
      content:
        'PideAI transformó completamente nuestro negocio. Ahora recibimos el triple de pedidos y la gestión es mucho más eficiente.',
      rating: 5,
    },
    {
      name: 'Carlos Méndez',
      business: 'Pizzería Don Carlos',
      content:
        'La mejor inversión para mi pizzería. El panel de cocina es increíble, todos los pedidos llegan organizados y en tiempo real.',
      rating: 5,
    },
    {
      name: 'Ana Rodríguez',
      business: 'Café & Co',
      content:
        'Súper fácil de configurar. En menos de una hora ya teníamos nuestro menú digital listo. Los clientes están encantados.',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Miles de negocios confían en PideAI para digitalizar sus operaciones
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
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={20} className="fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
              <div>
                <div className="font-semibold">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">{testimonial.business}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
