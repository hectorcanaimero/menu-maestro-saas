import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import { Upload, X, Plus, GripVertical, Image as ImageIcon, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  currentImages: string[];
  mainImageUrl: string | null;
  onSuccess: () => void;
}

interface ImageLimitInfo {
  enabled: boolean;
  max_images: number;
  is_unlimited: boolean;
  plan_name: string;
}

export const ProductImageGallery = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  currentImages,
  mainImageUrl,
  onSuccess,
}: ProductImageGalleryProps) => {
  const { store } = useStore();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(currentImages || []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch image limit info for the store
  const { data: limitInfo, isLoading: loadingLimits } = useQuery<ImageLimitInfo>({
    queryKey: ['product-image-limits', store?.id],
    queryFn: async () => {
      if (!store?.id) throw new Error('Store not found');

      const { data, error } = await supabase.rpc('get_product_image_limits', {
        p_store_id: store.id,
      });

      if (error) throw error;
      return data as ImageLimitInfo;
    },
    enabled: !!store?.id && open,
  });

  const totalImagesCount = images.length + pendingFiles.length;
  const maxImages = limitInfo?.max_images || 3;
  const canAddMore = totalImagesCount < maxImages;
  const remainingSlots = maxImages - totalImagesCount;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length && validFiles.length < remainingSlots; i++) {
      const file = files[i];
      if (allowedTypes.includes(file.type.toLowerCase())) {
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    }

    if (validFiles.length === 0) {
      toast.error('Solo se permiten imágenes JPG y PNG');
      return;
    }

    if (files.length > remainingSlots) {
      toast.warning(`Solo puedes agregar ${remainingSlots} imagen(es) más`);
    }

    setPendingFiles([...pendingFiles, ...validFiles]);
    setPendingPreviews([...pendingPreviews, ...newPreviews]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const removePendingImage = (index: number) => {
    const newFiles = [...pendingFiles];
    const newPreviews = [...pendingPreviews];

    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(newPreviews[index]);

    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setPendingFiles(newFiles);
    setPendingPreviews(newPreviews);
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      // Upload pending files
      for (const file of pendingFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Combine existing images with newly uploaded ones
      const finalImages = [...images, ...uploadedUrls];

      // Update menu item with new images array
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ images: finalImages })
        .eq('id', itemId);

      if (updateError) throw updateError;

      toast.success('Galería actualizada correctamente');
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving gallery:', error);
      toast.error('Error al guardar la galería');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up object URLs
    pendingPreviews.forEach(url => URL.revokeObjectURL(url));
    setPendingFiles([]);
    setPendingPreviews([]);
    setImages(currentImages || []);
    onOpenChange(false);
  };

  // Check if gallery is enabled (only for non-food businesses)
  if (!limitInfo?.enabled && !loadingLimits) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Galería no disponible</DialogTitle>
            <DialogDescription>
              La galería de imágenes solo está disponible para tiendas en modo catálogo (no restaurantes).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Galería de imágenes
            <Badge variant="outline" className="ml-2">
              {totalImagesCount}/{maxImages}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Editando: <span className="font-semibold">{itemName}</span>
            {limitInfo?.plan_name && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Plan {limitInfo.plan_name})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Main image indicator */}
          {mainImageUrl && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                La imagen principal se configura en "Cambiar imagen" del producto
              </p>
            </div>
          )}

          {/* Images grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Existing images */}
            {images.map((url, index) => (
              <div key={`existing-${index}`} className="relative group">
                <img
                  src={url}
                  alt={`Imagen ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeExistingImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Pending images (to upload) */}
            {pendingPreviews.map((url, index) => (
              <div key={`pending-${index}`} className="relative group">
                <img
                  src={url}
                  alt={`Nueva imagen ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg border border-primary border-dashed"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePendingImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
                <Badge className="absolute bottom-1 left-1 text-xs" variant="secondary">
                  Nueva
                </Badge>
              </div>
            ))}

            {/* Add image button */}
            {canAddMore && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "w-full aspect-square border-2 border-dashed rounded-lg",
                  "flex flex-col items-center justify-center gap-1",
                  "text-muted-foreground hover:text-primary hover:border-primary",
                  "transition-colors cursor-pointer",
                  uploading && "opacity-50 cursor-not-allowed"
                )}
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs">Agregar</span>
                <span className="text-xs text-muted-foreground/60">
                  ({remainingSlots} restantes)
                </span>
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Plan limit info */}
          {!limitInfo?.is_unlimited && (
            <div className="text-xs text-muted-foreground text-center">
              Tu plan permite hasta {maxImages} imágenes por producto.{' '}
              {remainingSlots === 0 && (
                <span className="text-amber-600">
                  Actualiza tu plan para agregar más imágenes.
                </span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={uploading}>
            {uploading ? 'Guardando...' : 'Guardar galería'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
