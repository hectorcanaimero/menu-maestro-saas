import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const FloatingShareButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success('¡Enlace copiado al portapapeles!');
    } catch (error) {
      console.error('Error al copiar enlace:', error);
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleShare}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="fixed right-8 bottom-24 md:right-28 md:bottom-8 z-50 h-12 w-12 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300"
            size="icon"
            aria-label="Compartir tienda"
          >
            <Share2 className={`h-8 w-8 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-sm">
          <p>Compartir tienda</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
