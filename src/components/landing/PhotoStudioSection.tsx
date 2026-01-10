import { Button } from '@/components/ui/button';
import { Wand2, ChevronLeft, ChevronRight, Sparkles, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { usePostHog } from '@/hooks/usePostHog';
import { useNavigate } from 'react-router-dom';

export const PhotoStudioSection = () => {
  const { track } = usePostHog();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Ejemplos de antes/después - Puedes usar URLs directas de Supabase o cualquier CDN
  const beforeAfterExamples = [
    {
      id: 1,
      before: 'https://wdpexjymbiyjqwdttqhz.supabase.co/storage/v1/object/public/menu-images/0.8189310918826478.jpeg', // Placeholder: reemplazar con imagen real
      after:
        'https://wdpexjymbiyjqwdttqhz.supabase.co/storage/v1/object/public/menu-images/ai-enhanced/5958078d-b8fd-432a-8fb3-b01aa0957cb0/152dc212-4f12-4e2b-a156-e340f4a6388c-premium-1x1-1767664978602.jpg', // Placeholder: reemplazar con imagen mejorada
      style: 'Estilo Premium',
      product: 'Arepa Rellena',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      id: 2,
      before: 'https://wdpexjymbiyjqwdttqhz.supabase.co/storage/v1/object/public/menu-images/0.16469807801882885.jpg',
      after:
        'https://wdpexjymbiyjqwdttqhz.supabase.co/storage/v1/object/public/menu-images/ai-enhanced/5958078d-b8fd-432a-8fb3-b01aa0957cb0/23c48d66-ed28-4c02-b0e6-c05866dccb10-dark_mode-1x1-1765301647383.png',
      style: 'Dark Mode',
      product: 'Ensalada Cesar',
      gradient: 'from-yellow-400 to-amber-500',
    },
    {
      id: 3,
      before: 'https://wdpexjymbiyjqwdttqhz.supabase.co/storage/v1/object/public/menu-images/0.9500933184660952.jpg',
      after:
        'https://wdpexjymbiyjqwdttqhz.supabase.co/storage/v1/object/public/menu-images/ai-enhanced/5958078d-b8fd-432a-8fb3-b01aa0957cb0/4a413bac-348f-4a5a-a3d9-e31bd719f0e2-top_view-1x1-1767050874009.png',
      style: 'Vista Cenital',
      product: 'Perro Caliente',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 4,
      before: 'https://wdpexjymbiyjqwdttqhz.supabase.co/storage/v1/object/public/menu-images/0.7757817704100912.jpeg',
      after:
        'https://wdpexjymbiyjqwdttqhz.supabase.co/storage/v1/object/public/menu-images/ai-enhanced/5958078d-b8fd-432a-8fb3-b01aa0957cb0/a749bc83-b79d-476b-b538-9e87a32cf14e-white_bg-1x1-1767665334702.jpg',
      style: 'Estilo e-comemrce',
      product: 'Altoparlantes',
      gradient: 'from-blue-500 to-cyan-500',
    },
  ];

  const handleTryAI = () => {
    track('photo_studio_try_ai_clicked', {
      section: 'photo_studio_hero',
      cta_type: 'create_store',
      feature: 'ai_photo_studio',
    });
    navigate('/auth?mode=signup');
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % beforeAfterExamples.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + beforeAfterExamples.length) % beforeAfterExamples.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % beforeAfterExamples.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, beforeAfterExamples.length]);

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-primary/5 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10 max-w-6xl">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-3 sm:mb-4">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-primary">Incluido para mejorar tus ventas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2">
            Mejora la imagen de tus productos en segundos con <span className="text-primary">IA</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            Sube una foto simple y obtén una imagen profesional lista para vender en tu menú o catálogo.
            <br className="hidden sm:block" />
            <span className="block sm:inline mt-2 sm:mt-0 text-primary font-semibold">
              5 mejoras de imagen incluidas cada mes en tu plan gratis.
            </span>
          </p>
        </motion.div>

        {/* Before/After Carousel */}
        <motion.div
          className="mb-8 sm:mb-12 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="relative">
            {/* Carousel Container */}
            <div className="relative aspect-square sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
                    {/* ANTES */}
                    <div className="relative group overflow-hidden">
                      {/* Imagen ANTES */}
                      <img
                        src={beforeAfterExamples[currentSlide].before}
                        alt={`${beforeAfterExamples[currentSlide].product} - Antes`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Label ANTES */}
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-1 sm:px-4 sm:py-2 bg-black/70 backdrop-blur-sm rounded-md sm:rounded-lg z-10">
                        <p className="text-white font-semibold text-xs sm:text-sm">Foto Original</p>
                      </div>

                      {/* Dark overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    </div>

                    {/* DESPUÉS */}
                    <div className="relative group overflow-hidden">
                      {/* Imagen DESPUÉS */}
                      <img
                        src={beforeAfterExamples[currentSlide].after}
                        alt={`${beforeAfterExamples[currentSlide].product} - Después (IA)`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Label DESPUÉS */}
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-1 sm:px-4 sm:py-2 bg-primary backdrop-blur-sm rounded-md sm:rounded-lg shadow-lg z-10">
                        <p className="text-white font-semibold text-xs sm:text-sm">Imagen optimizada</p>
                      </div>

                      {/* Sparkle effect */}
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                        <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary drop-shadow-lg animate-pulse" />
                      </div>

                      {/* Style badge */}
                      <div className="absolute bottom-2 left-2 sm:bottom-20 sm:left-4 px-2 py-1 sm:px-3 sm:py-1.5 bg-primary/90 backdrop-blur-sm rounded-full z-10">
                        <p className="text-white text-[10px] sm:text-xs font-semibold">
                          {beforeAfterExamples[currentSlide].style}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 sm:px-6 sm:py-3 bg-black/70 backdrop-blur-md rounded-full">
                    <p className="text-white text-xs sm:text-sm font-medium">
                      {beforeAfterExamples[currentSlide].product} • {beforeAfterExamples[currentSlide].style}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors flex items-center justify-center text-white z-20"
                aria-label="Anterior ejemplo"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors flex items-center justify-center text-white z-20"
                aria-label="Siguiente ejemplo"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
              {beforeAfterExamples.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all ${
                    currentSlide === index ? 'w-6 sm:w-8 bg-primary' : 'w-1.5 sm:w-2 bg-muted-foreground/30'
                  }`}
                  aria-label={`Ir a ejemplo ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Features */}
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12 max-w-3xl mx-auto px-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-0.5 sm:mb-1">7</div>
            <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">estilos profesionales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-0.5 sm:mb-1">5</div>
            <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">imágenes gratis al mes</div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button size="lg" onClick={handleTryAI} className="w-full sm:w-auto sm:min-w-[250px]">
            <Wand2 className="mr-2" size={20} />
            Crear Tienda Gratis
          </Button>
        </motion.div>

        {/* Value Prop */}
        <motion.p
          className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 px-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          ✨ Sin fotógrafo • Sin estudio • Sin complicaciones
        </motion.p>
      </div>
    </section>
  );
};
