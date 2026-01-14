import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Sparkles,
  Wand2,
  ImageIcon,
  Check,
  X,
  Loader2,
  Sun,
  Moon,
  Palette,
  Minimize2,
  Crown,
  Brush,
  Square,
  RectangleVertical,
  Smartphone,
  ScanEye,
  Download,
  Share2,
  ArrowUpFromLine,
} from 'lucide-react';
import { useAICredits } from '@/hooks/useAICredits';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
  id: string;
  name: string;
  image_url: string | null;
}

interface AIPhotoStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
  onImageUpdated: () => void;
}

type StyleType = 'realistic' | 'premium' | 'animated' | 'minimalist' | 'white_bg' | 'dark_mode' | 'top_view';
type AspectRatio = '1:1' | '4:5' | '9:16';

interface StyleOption {
  id: StyleType;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

interface AspectRatioOption {
  id: AspectRatio;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'realistic',
    name: 'Realista',
    description: 'Foto profesional de estudio',
    icon: <Sun className="w-5 h-5" />,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Estilo lujoso y elegante',
    icon: <Crown className="w-5 h-5" />,
    gradient: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'animated',
    name: 'Animado',
    description: 'Estilo ilustrado colorido',
    icon: <Brush className="w-5 h-5" />,
    gradient: 'from-pink-500 to-purple-500',
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Limpio y moderno',
    icon: <Minimize2 className="w-5 h-5" />,
    gradient: 'from-slate-400 to-slate-600',
  },
  {
    id: 'white_bg',
    name: 'Fondo Blanco',
    description: 'Estilo e-commerce',
    icon: <ImageIcon className="w-5 h-5" />,
    gradient: 'from-gray-200 to-gray-400',
  },
  {
    id: 'dark_mode',
    name: 'Dark Mode',
    description: 'Fondo oscuro dramático',
    icon: <Moon className="w-5 h-5" />,
    gradient: 'from-slate-700 to-slate-900',
  },
  {
    id: 'top_view',
    name: 'Vista Cenital',
    description: 'Foto 360° desde arriba',
    icon: <ScanEye className="w-5 h-5" />,
    gradient: 'from-blue-500 to-cyan-500',
  },
];

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  {
    id: '1:1',
    name: 'Cuadrado',
    description: 'Feed Instagram',
    icon: <Square className="w-4 h-4" />,
  },
  {
    id: '4:5',
    name: 'Portrait',
    description: 'Mejor engagement',
    icon: <RectangleVertical className="w-4 h-4" />,
  },
  {
    id: '9:16',
    name: 'Stories',
    description: 'Stories y Reels',
    icon: <Smartphone className="w-4 h-4" />,
  },
];

const getAspectRatioClass = (ratio: AspectRatio) => {
  switch (ratio) {
    case '1:1':
      return 'aspect-square';
    case '4:5':
      return 'aspect-[4/5]';
    case '9:16':
      return 'aspect-[9/16]';
    default:
      return 'aspect-square';
  }
};

export const AIPhotoStudio = ({ open, onOpenChange, menuItem, onImageUpdated }: AIPhotoStudioProps) => {
  const { store } = useStore();
  const { availableCredits, monthlyRemaining, monthlyTotal, extraCredits, useCredit, refetch } = useAICredits();

  const [selectedStyle, setSelectedStyle] = useState<StyleType>('realistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleGenerate = async () => {
    if (!menuItem?.image_url) {
      toast.error('Este producto no tiene imagen para mejorar');
      return;
    }

    if (availableCredits <= 0) {
      toast.error('No tienes créditos disponibles');
      return;
    }

    setIsProcessing(true);
    setPreviewUrl(null);

    try {
      const response = await supabase.functions.invoke('enhance-product-image', {
        body: {
          imageUrl: menuItem.image_url,
          style: selectedStyle,
          aspectRatio: aspectRatio,
          menuItemId: menuItem.id,
          menuItemName: '',
          storeId: store?.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al procesar imagen');
      }

      if (response.data?.error) {
        if (response.data.status === 429) {
          toast.error('Límite de solicitudes excedido. Intenta de nuevo más tarde.');
        } else if (response.data.status === 402) {
          toast.error('Se requiere agregar créditos. Contacta al soporte.');
        } else {
          throw new Error(response.data.error);
        }
        return;
      }

      const { enhancedImageUrl } = response.data;

      if (!enhancedImageUrl) {
        throw new Error('No se recibió imagen mejorada');
      }

      setPreviewUrl(enhancedImageUrl);

      const creditResult = await useCredit();
      if (!creditResult.success) {
        throw new Error('Error al usar crédito');
      }

      refetch();
      toast.success('¡Imagen mejorada con éxito!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al mejorar imagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!previewUrl || !menuItem) return;

    setIsApplying(true);
    try {
      const { error } = await supabase.from('menu_items').update({ image_url: previewUrl }).eq('id', menuItem.id);

      if (error) throw error;

      toast.success('Imagen aplicada al producto');
      onImageUpdated();
      handleClose();
    } catch (error) {
      toast.error('Error al aplicar imagen');
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedStyle('realistic');
    setAspectRatio('1:1');
    onOpenChange(false);
  };

  const handleDiscard = () => {
    setPreviewUrl(null);
  };

  const handleDownload = async () => {
    if (!previewUrl) return;

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${menuItem?.name || 'imagen'}-mejorada-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Imagen descargada');
    } catch (error) {
      toast.error('Error al descargar imagen');
    }
  };

  const handleShare = async () => {
    if (!previewUrl) return;

    if (navigator.share) {
      try {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        const file = new File([blob], `${menuItem?.name || 'imagen'}-mejorada.jpg`, { type: 'image/jpeg' });

        await navigator.share({
          title: `Imagen mejorada - ${menuItem?.name}`,
          text: 'Imagen generada con IA en PideAI',
          files: [file],
        });
        toast.success('Compartido exitosamente');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleFallbackShare();
        }
      }
    } else {
      handleFallbackShare();
    }
  };

  const handleFallbackShare = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
      toast.success('Link copiado al portapapeles');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-3xl h-[95vh] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Estudio Fotográfico con IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Credits Display */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">Créditos disponibles</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-mono text-xs">
                {monthlyRemaining}/{monthlyTotal} este mes
              </Badge>
              {extraCredits > 0 && (
                <Badge variant="outline" className="font-mono text-xs">
                  +{extraCredits} extra
                </Badge>
              )}
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          {!previewUrl && (
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium">📐 Formato de salida (Instagram)</p>
              <div className="grid grid-cols-1 sm:flex gap-2">
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setAspectRatio(option.id)}
                    className={`flex-1 flex items-center gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                      aspectRatio === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option.icon}
                    <div className="text-left flex-1">
                      <p className="text-xs sm:text-sm font-medium">{option.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    {aspectRatio === option.id && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current vs Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Current Image */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-medium mb-2 text-muted-foreground">Imagen Actual</p>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {menuItem?.image_url ? (
                    <img src={menuItem.image_url} alt={menuItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">Sin imagen</p>
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium mt-2 text-center truncate">{menuItem?.name}</p>
              </CardContent>
            </Card>

            {/* Preview/Result */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-medium mb-2 text-muted-foreground">
                  {previewUrl ? 'Resultado' : 'Vista Previa'} ({aspectRatio})
                </p>
                <div
                  className={`${getAspectRatioClass(
                    aspectRatio,
                  )} max-h-[300px] sm:max-h-[400px] bg-muted rounded-lg overflow-hidden flex items-center justify-center relative mx-auto group`}
                >
                  <AnimatePresence mode="wait">
                    {isProcessing ? (
                      <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center p-4"
                      >
                        <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-primary animate-spin" />
                        <p className="text-xs sm:text-sm text-muted-foreground">Mejorando imagen...</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          Esto puede tomar unos segundos
                        </p>
                      </motion.div>
                    ) : previewUrl ? (
                      <>
                        <motion.img
                          key="preview"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          src={previewUrl}
                          alt="Preview mejorada"
                          className="w-full h-full object-cover"
                        />
                        {/* Action Buttons Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-4">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleDownload}
                            className="flex flex-col gap-1 h-auto py-2 px-3 bg-white/90 hover:bg-white"
                            title="Descargar"
                          >
                            <Download className="w-5 h-5" />
                            <span className="text-xs">Descargar</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleShare}
                            className="flex flex-col gap-1 h-auto py-2 px-3 bg-white/90 hover:bg-white"
                            title="Compartir"
                          >
                            <Share2 className="w-5 h-5" />
                            <span className="text-xs">Compartir</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleApply}
                            disabled={isApplying}
                            className="flex flex-col gap-1 h-auto py-2 px-3 bg-primary/90 hover:bg-primary text-white"
                            title="Usar en producto"
                          >
                            {isApplying ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <ArrowUpFromLine className="w-5 h-5" />
                            )}
                            <span className="text-xs">Usar</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-muted-foreground p-4"
                      >
                        <Wand2 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm">Selecciona un estilo y genera</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Style Selection */}
          {!previewUrl && (
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm font-medium">🎨 Selecciona un estilo</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {STYLE_OPTIONS.map((style) => (
                  <motion.button
                    key={style.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                      selectedStyle === style.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white mb-2`}
                    >
                      {style.icon}
                    </div>
                    <p className="font-medium text-xs sm:text-sm">{style.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{style.description}</p>
                    {selectedStyle === style.id && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3">
            {previewUrl ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleDiscard}
                  className="flex-1 text-xs sm:text-sm"
                  disabled={isApplying}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Generar Otra</span>
                  <span className="xs:hidden">Nueva</span>
                </Button>
                <Button variant="outline" onClick={handleClose} className="text-xs sm:text-sm" disabled={isApplying}>
                  Cerrar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose} className="flex-1 text-xs sm:text-sm">
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerate}
                  className="flex-1 text-xs sm:text-sm"
                  disabled={isProcessing || !menuItem?.image_url || availableCredits <= 0}
                >
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  )}
                  <span className="hidden xs:inline">Mejorar Imagen</span>
                  <span className="xs:hidden">Mejorar</span>
                </Button>
              </>
            )}
          </div>

          {/* Help Text - Action Buttons */}
          {previewUrl && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                💡 <strong>Tip:</strong> Pasa el cursor sobre la imagen para ver las opciones de descarga, compartir y
                usar en producto
              </p>
            </div>
          )}

          {/* Help text */}
          {availableCredits <= 0 && (
            <p className="text-xs sm:text-sm text-destructive text-center">
              No tienes créditos disponibles. Los créditos se renuevan cada mes.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
