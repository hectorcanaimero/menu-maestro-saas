import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, QrCode } from 'lucide-react';
import { formatSubdomainDisplay } from '@/lib/subdomain-validation';
import pideaiLogo from '@/assets/logo.svg';

interface StoreQRCodeProps {
  storeSubdomain: string;
}

export const StoreQRCode = ({ storeSubdomain }: StoreQRCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate the store URL
  const storeUrl = `https://${formatSubdomainDisplay(storeSubdomain)}`;

  /**
   * Download QR code as PNG with PideAI logo in center
   */
  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      // Get the SVG element
      const svgElement = qrRef.current.querySelector('svg');
      if (!svgElement) return;

      // Create a canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (larger for better quality)
      const size = 1000;
      canvas.width = size;
      canvas.height = size;

      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);

      // Convert QR SVG to image
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const qrUrl = URL.createObjectURL(svgBlob);

      // Load QR code
      const qrImg = new Image();
      qrImg.onload = () => {
        // Draw QR code
        ctx.drawImage(qrImg, 0, 0, size, size);

        // Load PideAI logo
        const logo = new Image();
        logo.onload = () => {
          const centerX = size / 2;
          const centerY = size / 2;
          const logoSize = size * 0.2; // 20% of QR size

          // Draw white circle background for logo
          const circleRadius = logoSize * 0.75;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
          ctx.fill();

          // Draw logo in center
          const logoX = centerX - logoSize / 2;
          const logoY = centerY - logoSize / 2;
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

          // Download
          canvas.toBlob((blob) => {
            if (!blob) return;

            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `qr-code-pideai-${storeSubdomain}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
          });

          URL.revokeObjectURL(qrUrl);
        };

        logo.onerror = () => {
          console.error('Error loading PideAI logo');
          URL.revokeObjectURL(qrUrl);
        };

        logo.src = pideaiLogo;
      };

      qrImg.onerror = () => {
        console.error('Error loading QR code');
        URL.revokeObjectURL(qrUrl);
      };

      qrImg.src = qrUrl;
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <CardTitle>Código QR de tu Tienda</CardTitle>
        </div>
        <CardDescription>
          Comparte este código QR con tus clientes para que accedan fácilmente a tu tienda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex flex-col items-center space-y-4">
          <div
            ref={qrRef}
            className="p-6 bg-white rounded-lg border-2 border-border shadow-sm"
          >
            <QRCodeSVG
              value={storeUrl}
              size={256}
              level="H" // High error correction to accommodate logo
              marginSize={4}
              imageSettings={{
                src: pideaiLogo,
                height: 50,
                width: 50,
                excavate: true,
              }}
            />
          </div>

          {/* Store URL */}
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">URL de tu tienda:</p>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {storeUrl}
            </a>
          </div>

          {/* Download Button */}
          <Button onClick={handleDownload} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Descargar QR Code
          </Button>

          {/* Info Text */}
          <div className="text-xs text-muted-foreground text-center max-w-md">
            <p>
              El código QR incluye el logo de PideAI en el centro. Puedes imprimirlo
              y colocarlo en tu negocio para que tus clientes escaneen y accedan
              directamente a tu menú digital.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
