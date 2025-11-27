import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const FAQSection = () => {
  const faqs = [
    {
      question: '¿Necesito conocimientos técnicos para usar PideAI?',
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
      question: '¿Qué métodos de pago aceptan?',
      answer:
        'Aceptamos todos los métodos de pago principales: tarjetas de crédito, débito, transferencias bancarias y pagos móviles.',
    },
    {
      question: '¿Hay límite de productos que puedo agregar?',
      answer:
        'No, en todos nuestros planes puedes agregar productos ilimitados a tu catálogo digital.',
    },
    {
      question: '¿Ofrecen soporte técnico?',
      answer:
        'Sí, todos nuestros planes incluyen soporte técnico. El plan Pro y Business incluyen soporte prioritario 24/7.',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Preguntas Frecuentes</h2>
          <p className="text-lg text-muted-foreground">
            Resolvemos tus dudas sobre PideAI
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
