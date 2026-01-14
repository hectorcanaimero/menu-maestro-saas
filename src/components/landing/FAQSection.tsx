import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

export const FAQSection = () => {
  const faqs = [
    {
      question: '¿Necesito conocimientos técnicos para usar PideAí?',
      answer:
        'No, PideAI está diseñado para ser intuitivo y fácil de usar. Cualquier persona puede configurar su tienda en minutos sin necesidad de conocimientos técnicos.',
    },
    {
      question: '¿Cuánto tiempo toma configurar mi tienda?',
      answer:
        'La configuración básica toma menos de 5 minutos. Puedes agregar tu logo, colores, productos y estar listo para recibir pedidos en muy poco tiempo.',
    },
    {
      question: '¿Puedo cancelar mi suscripción en cualquier momento?',
      answer:
        'Sí, puedes cancelar tu suscripción en cualquier momento sin penalización. No hay contratos de permanencia.',
    },
    {
      question: '¿Ofrecen soporte técnico?',
      answer:
        'Sí, todos nuestros planes incluyen soporte técnico. El plan Pro y Business incluyen soporte prioritario 24/7.',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-3xl px-2 sm:px-6 lg:px-12">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Preguntas Frecuentes</h2>
          <p className="text-lg text-muted-foreground">Resolvemos tus dudas sobre PideAI</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
