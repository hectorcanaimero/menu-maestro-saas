import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  Smartphone
} from "lucide-react";
import { useAICredits } from "@/hooks/useAICredits";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

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

type StyleType = 'realistic' | 'premium' | 'animated' | 'minimalist' | 'white_bg' | 'dark_mode';
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
    case '1:1': return 'aspect-square';
    case '4:5': return 'aspect-[4/5]';
    case '9:16': return 'aspect-[9/16]';
    default: return 'aspect-square';
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
      toast.error("Este producto no tiene imagen para mejorar");
      return;
    }

    if (availableCredits <= 0) {
      toast.error("No tienes créditos disponibles");
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
          menuItemName: menuItem.name,
          storeId: store?.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al procesar imagen');
      }

      if (response.data?.error) {
        if (response.data.status === 429) {
          toast.error("Límite de solicitudes excedido. Intenta de nuevo más tarde.");
        } else if (response.data.status === 402) {
          toast.error("Se requiere agregar créditos. Contacta al soporte.");
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
        console.warn("Could not deduct credit");
      }
      
      refetch();
      toast.success("¡Imagen mejorada con éxito!");
    } catch (error) {
      console.error("Error enhancing image:", error);
      toast.error(error instanceof Error ? error.message : "Error al mejorar imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!previewUrl || !menuItem) return;

    setIsApplying(true);
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ image_url: previewUrl })
        .eq('id', menuItem.id);

      if (error) throw error;

      toast.success("Imagen aplicada al producto");
      onImageUpdated();
      handleClose();
    } catch (error) {
      console.error("Error applying image:", error);
      toast.error("Error al aplicar imagen");
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Estudio Fotográfico con IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Credits Display */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Créditos disponibles</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {monthlyRemaining}/{monthlyTotal} este mes
              </Badge>
              {extraCredits > 0 && (
                <Badge variant="outline" className="font-mono">
                  +{extraCredits} extra
                </Badge>
              )}
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          {!previewUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">📐 Formato de salida (Instagram)</p>
              <div className="flex gap-2">
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setAspectRatio(option.id)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      aspectRatio === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option.icon}
                    <div className="text-left">
                      <p className="text-sm font-medium">{option.name}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    {aspectRatio === option.id && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current vs Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Image */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2 text-muted-foreground">Imagen Actual</p>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {menuItem?.image_url ? (
                    <img 
                      src={menuItem.image_url} 
                      alt={menuItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin imagen</p>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium mt-2 text-center truncate">{menuItem?.name}</p>
              </CardContent>
            </Card>

            {/* Preview/Result */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2 text-muted-foreground">
                  {previewUrl ? 'Resultado' : 'Vista Previa'} ({aspectRatio})
                </p>
                <div className={`${getAspectRatioClass(aspectRatio)} max-h-[400px] bg-muted rounded-lg overflow-hidden flex items-center justify-center relative mx-auto`}>
                  <AnimatePresence mode="wait">
                    {isProcessing ? (
                      <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                      >
                        <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Mejorando imagen...</p>
                        <p className="text-xs text-muted-foreground mt-1">Esto puede tomar unos segundos</p>
                      </motion.div>
                    ) : previewUrl ? (
                      <motion.img
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        src={previewUrl}
                        alt="Preview mejorada"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-muted-foreground p-4"
                      >
                        <Wand2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Selecciona un estilo y genera</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Style Selection */}
          {!previewUrl && (
            <div className="space-y-3">
              <p className="text-sm font-medium">🎨 Selecciona un estilo</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {STYLE_OPTIONS.map((style) => (
                  <motion.button
                    key={style.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      selectedStyle === style.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white mb-2`}>
                      {style.icon}
                    </div>
                    <p className="font-medium text-sm">{style.name}</p>
                    <p className="text-xs text-muted-foreground">{style.description}</p>
                    {selectedStyle === style.id && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {previewUrl ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleDiscard}
                  className="flex-1"
                  disabled={isApplying}
                >
                  <X className="w-4 h-4 mr-2" />
                  Descartar
                </Button>
                <Button 
                  onClick={handleApply}
                  className="flex-1"
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Aplicar al Producto
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleGenerate}
                  className="flex-1"
                  disabled={isProcessing || !menuItem?.image_url || availableCredits <= 0}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Mejorar Imagen
                </Button>
              </>
            )}
          </div>

          {/* Help text */}
          {availableCredits <= 0 && (
            <p className="text-sm text-destructive text-center">
              No tienes créditos disponibles. Los créditos se renuevan cada mes.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
