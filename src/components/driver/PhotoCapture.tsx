import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, Check, Loader2, AlertCircle } from 'lucide-react';

interface PhotoCaptureProps {
  onSave: (photoDataUrl: string) => void;
  onCancel?: () => void;
}

export function PhotoCapture({ onSave, onCancel }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => resolve()).catch(() => resolve());
            };
          } else {
            resolve();
          }
        });

        setStream(mediaStream);
        setCameraActive(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setIsLoading(false);

      let errorMessage = 'No se pudo acceder a la cámara.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permiso de cámara denegado. Por favor, habilita el acceso a la cámara en la configuración de tu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);

        // Stop camera after capturing
        stopCamera();
      }
    }
  };

  const retake = () => {
    setPhoto(null);
    startCamera();
  };

  const handleSave = () => {
    if (photo) {
      onSave(photo);
    }
  };

  const handleCancel = () => {
    stopCamera();
    setPhoto(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Foto de Comprobación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-lg">
            <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Iniciando cámara...
            </p>
          </div>
        )}

        {/* Initial State */}
        {!cameraActive && !photo && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-lg">
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Toma una foto del pedido entregado
            </p>
            <Button onClick={startCamera} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Abrir Cámara
                </>
              )}
            </Button>
          </div>
        )}

        {cameraActive && !photo && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
                style={{ maxHeight: '60vh' }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={stopCamera} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </Button>
            </div>
          </div>
        )}

        {photo && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border">
              <img src={photo} alt="Captured" className="w-full h-auto" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={retake} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Repetir
              </Button>
              {onCancel && (
                <Button variant="ghost" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <p className="text-xs text-muted-foreground text-center">
          📸 La foto debe mostrar claramente el pedido entregado
        </p>
      </CardContent>
    </Card>
  );
}
