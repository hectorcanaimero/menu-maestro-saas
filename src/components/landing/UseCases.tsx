import { useState } from 'react';
import { Pizza, Coffee, UtensilsCrossed, Truck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const UseCases = () => {
  const [activeCase, setActiveCase] = useState(0);

  const cases = [
    {
      icon: Pizza,
      title: '🍕 Comida y Restaurantes',
      tagline: 'Pedidos claros, menos errores y más control.',
      benefits: [
        'Menú visual con fotos y descripciones claras',
        'Extras y personalizaciones bien definidas',
        'Pedidos organizados desde el primer mensaje',
        'Menos llamadas, menos confusión',
      ],
      stats: {
        metric: '+35%',
        label: 'Más ventas y menos estrés en horas pico.',
      },
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Coffee,
      title: '🛍️ Tiendas y Emprendimientos',
      tagline: 'Catálogos claros para que tus clientes pidan sin escribir mil mensajes.',
      benefits: [
        'Catálogo con fotos, precios y variantes',
        'Pedidos estructurados por WhatsApp',
        'Control de productos y promociones',
      ],
      stats: {
        metric: '60%',
        label: 'menos tiempo en filas',
      },
      color: 'from-amber-700 to-amber-900',
    },
    {
      icon: UtensilsCrossed,
      title: '💄 Belleza & Servicios',
      tagline: 'Organiza solicitudes, servicios y horarios desde un solo enlace.',
      benefits: ['Enlace único para mostrar todo', 'Pedidos claros sin confusión', 'Mejor experiencia para el cliente'],
      stats: {
        metric: '45%',
        label: 'más eficiencia operativa',
      },
      color: 'from-emerald-600 to-teal-700',
    },
    {
      icon: Truck,
      title: '🧾 Negocios por catálogo',
      tagline: 'Ideal si vendes por WhatsApp y quieres más orden.',
      benefits: [
        'Actualiza ubicación en tiempo real',
        'Menú que cambia según disponibilidad',
        'Pagos digitales sin efectivo',
        'Clientes te encuentran en el mapa',
      ],
      stats: {
        metric: '3x',
        label: 'más alcance de clientes',
      },
      color: 'from-blue-600 to-indigo-700',
    },
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Perfecto para Tu Tipo de Negocio</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No importa qué vendas: tus clientes pueden pedir de forma clara y ordenada.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {cases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <button
                key={index}
                onClick={() => setActiveCase(index)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  activeCase === index
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-card text-foreground hover:bg-muted border border-border'
                }`}
                aria-label={`Ver caso de uso para ${useCase.title}`}
                aria-pressed={activeCase === index}
              >
                {/* <Icon size={20} aria-hidden="true" /> */}
                <span className="text-sm md:text-base">{useCase.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Benefits */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">{cases[activeCase].title}</h3>
                  <p className="text-lg text-muted-foreground">{cases[activeCase].tagline}</p>
                </div>

                <ul className="space-y-4">
                  {cases[activeCase].benefits.map((benefit, idx) => (
                    <motion.li
                      key={idx}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <CheckCircle2 size={24} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-base">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Stats Badge */}
                <div className="inline-flex items-center gap-3 bg-card border border-border rounded-lg px-6 py-4">
                  <div>
                    <div className="text-3xl font-bold text-primary">{cases[activeCase].stats.metric}</div>
                    <div className="text-sm text-muted-foreground">{cases[activeCase].stats.label}</div>
                  </div>
                </div>
              </div>

              {/* Right: Mockup Placeholder */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`relative aspect-[4/3] rounded-2xl bg-gradient-to-br ${cases[activeCase].color} p-1 shadow-2xl`}
                >
                  <div className="w-full h-full bg-background rounded-xl flex items-center justify-center">
                    {/* Placeholder for screenshot/mockup */}
                    <div className="text-center p-8">
                      <div
                        className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${cases[activeCase].color} flex items-center justify-center`}
                      >
                        {(() => {
                          const Icon = cases[activeCase].icon;
                          return <Icon size={40} className="text-white" aria-hidden="true" />;
                        })()}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Vista previa del menú digital para {cases[activeCase].title.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Decorative elements */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                  <div
                    className={`absolute top-0 right-0 w-72 h-72 bg-gradient-to-br ${cases[activeCase].color} rounded-full opacity-10 blur-3xl`}
                  />
                  <div
                    className={`absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr ${cases[activeCase].color} rounded-full opacity-10 blur-3xl`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
