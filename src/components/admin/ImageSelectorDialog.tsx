import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

interface ImageSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  currentImageUrl: string | null;
  onSuccess: () => void;
}

export const ImageSelectorDialog = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  currentImageUrl,
  onSuccess,
}: ImageSelectorDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow JPG and PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Solo se permiten imágenes JPG y PNG');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadAndSave = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    setUploading(true);
    try {
      // Upload image
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('menu-images').upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('menu-images').getPublicUrl(filePath);

      // Update menu item
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ image_url: publicUrl })
        .eq('id', itemId);

      if (updateError) throw updateError;

      toast.success('Imagen actualizada correctamente');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setUploading(true);
    try {
      const { error } = await supabase.from('menu_items').update({ image_url: null }).eq('id', itemId);

      if (error) throw error;

      toast.success('Imagen eliminada');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Error al eliminar imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cambiar imagen</DialogTitle>
          <DialogDescription>
            Editando: <span className="font-semibold">{itemName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="flex justify-center">
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full max-w-xs h-48 object-cover rounded-lg border" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-xs h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">No hay imagen seleccionada</p>
                </div>
              </div>
            )}
          </div>

          {/* File input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Seleccionar imagen
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentImageUrl && (
            <Button variant="destructive" onClick={handleRemoveImage} disabled={uploading} className="sm:mr-auto">
              Eliminar imagen actual
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUploadAndSave} disabled={uploading || !selectedFile}>
            {uploading ? 'Subiendo...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
