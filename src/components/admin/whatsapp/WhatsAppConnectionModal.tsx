import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Smartphone, QrCode, AlertTriangle } from 'lucide-react';
import { useWhatsAppSettings } from '@/hooks/useWhatsAppSettings';

interface WhatsAppConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

type ConnectionState =
  | 'idle'
  | 'creating_instance'
  | 'fetching_qr'
  | 'showing_qr'
  | 'polling'
  | 'connected'
  | 'error';

export function WhatsAppConnectionModal({
  open,
  onOpenChange,
  onConnected
}: WhatsAppConnectionModalProps) {
  const { createInstance, getQRCode, checkConnectionStatus, instanceName } = useWhatsAppSettings();

  const [state, setState] = useState<ConnectionState>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollingAttempts = 60; // 60 attempts * 3 seconds = 3 minutes

  // Check if user is on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Start connection flow when modal opens
  useEffect(() => {
    if (open && state === 'idle') {
      handleStartConnection();
    }
  }, [open]);

  /**
   * Start the connection process
   */
  const handleStartConnection = async () => {
    setState('creating_instance');
    setError(null);
    setQrCode(null);
    setPollingAttempts(0);

    try {
      // Step 1: Create instance (or verify it exists)
      const createResult = await createInstance();

      if (!createResult.success) {
        setState('error');
        setError('No se pudo crear la instancia. Verifica la configuración de Evolution API.');
        return;
      }

      // Step 2: Get QR Code
      setState('fetching_qr');
      const qrResult = await getQRCode();

      if (!qrResult.success || !qrResult.qr_code) {
        setState('error');
        setError('No se pudo obtener el código QR. Intenta de nuevo.');
        return;
      }

      // Step 3: Show QR Code and start polling
      setQrCode(qrResult.qr_code);
      setState('showing_qr');

      // Start polling connection status
      startPolling();

    } catch (err) {
      console.error('Connection error:', err);
      setState('error');
      setError('Error inesperado. Por favor, intenta de nuevo.');
    }
  };

  /**
   * Start polling for connection status
   */
  const startPolling = () => {
    setState('polling');
    setPollingAttempts(0);

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Check immediately
    checkConnection();

    // Then check every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      await checkConnection();
    }, 3000);
  };

  /**
   * Check if WhatsApp is connected
   */
  const checkConnection = async () => {
    setPollingAttempts(prev => prev + 1);

    const result = await checkConnectionStatus();

    if (result.connected) {
      // Success! Connected
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      setState('connected');
      setConnectedPhone(result.phone || null);

      // Call onConnected callback
      if (onConnected) {
        onConnected();
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);

    } else if (pollingAttempts >= maxPollingAttempts) {
      // Timeout: stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      setState('error');
      setError('Tiempo de espera agotado. Por favor, intenta de nuevo.');
    }
  };

  /**
   * Handle retry
   */
  const handleRetry = () => {
    setState('idle');
    setError(null);
    setQrCode(null);
    setPollingAttempts(0);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    handleStartConnection();
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setState('idle');
    setError(null);
    setQrCode(null);
    setPollingAttempts(0);
    onOpenChange(false);
  };

  /**
   * Open WhatsApp on mobile
   */
  const handleOpenWhatsApp = () => {
    if (isMobile && qrCode) {
      // For mobile, we can try to open WhatsApp directly
      // Note: This may not work on all devices/browsers
      window.open('https://wa.me/', '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Instancia: <span className="font-mono font-semibold">{instanceName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading State: Creating Instance */}
          {state === 'creating_instance' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Creando instancia...</p>
            </div>
          )}

          {/* Loading State: Fetching QR */}
          {state === 'fetching_qr' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generando código QR...</p>
            </div>
          )}

          {/* Showing QR Code */}
          {(state === 'showing_qr' || state === 'polling') && qrCode && (
            <div className="space-y-4">
              {/* Mobile Instructions */}
              {isMobile && (
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    Estás en un dispositivo móvil. Abre WhatsApp y escanea el código QR desde otro dispositivo,
                    o usa la opción "Dispositivos vinculados" en WhatsApp.
                  </AlertDescription>
                </Alert>
              )}

              {/* Desktop Instructions */}
              {!isMobile && (
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Abre WhatsApp en tu teléfono y escanea este código QR:
                    <br />
                    <strong>WhatsApp {'>'} Ajustes {'>'} Dispositivos vinculados {'>'} Vincular dispositivo</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* QR Code Display */}
              <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed">
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>

              {/* Polling Indicator */}
              {state === 'polling' && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Esperando conexión... ({pollingAttempts}/{maxPollingAttempts})</span>
                </div>
              )}

              {/* Mobile Action Button */}
              {isMobile && (
                <Button
                  onClick={handleOpenWhatsApp}
                  variant="outline"
                  className="w-full"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Abrir WhatsApp
                </Button>
              )}
            </div>
          )}

          {/* Connected State */}
          {state === 'connected' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">¡Conectado exitosamente!</p>
                {connectedPhone && (
                  <p className="text-sm text-muted-foreground">
                    Número: <span className="font-mono">{connectedPhone}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || 'Ocurrió un error al conectar WhatsApp'}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={handleRetry}
                  className="flex-1"
                >
                  Reintentar
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons (when showing QR) */}
          {(state === 'showing_qr' || state === 'polling') && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRetry}
                variant="secondary"
                className="flex-1"
              >
                Generar nuevo QR
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
