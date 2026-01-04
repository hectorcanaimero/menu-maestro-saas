import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Copy, ExternalLink, BarChart3, Check } from 'lucide-react';
import { useShlink } from '@/hooks/useShlink';

interface ShortUrlDisplayProps {
  shortUrl: string;
  shortCode: string;
  longUrl: string;
}

/**
 * Component for displaying shortened URLs with statistics and actions
 *
 * Features:
 * - Displays short URL with copy-to-clipboard functionality
 * - Shows click statistics (total, human, bots)
 * - External link button to open the short URL
 * - Expandable section to view original long URL
 * - Automatic stats loading on mount
 *
 * @param shortUrl - The full shortened URL (e.g., "https://x.pideai.com/abc123")
 * @param shortCode - The short code for stats lookup (e.g., "abc123")
 * @param longUrl - The original long URL
 */
export function ShortUrlDisplay({ shortUrl, shortCode, longUrl }: ShortUrlDisplayProps) {
  const { fetchStats } = useShlink();
  const [stats, setStats] = useState<{ total: number; nonBots: number; bots: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load statistics on mount
  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      const result = await fetchStats(shortCode);
      if (result) {
        setStats(result.visitsSummary);
      }
      setLoadingStats(false);
    }

    if (shortCode) {
      loadStats();
    }
  }, [shortCode, fetchStats]);

  /**
   * Copy short URL to clipboard with visual feedback
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success('URL copiada al portapapeles');

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar la URL');
    }
  };

  /**
   * Open short URL in new tab
   */
  const handleOpenExternal = () => {
    window.open(shortUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      {/* Short URL Display with Actions */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Enlace Corto del Comprobante</p>
        <div className="flex gap-2">
          {/* URL Display */}
          <div className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm truncate border">{shortUrl}</div>

          {/* Copy Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-shrink-0"
            title={copied ? 'Copiado!' : 'Copiar URL'}
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </Button>

          {/* External Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenExternal}
            className="flex-shrink-0"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Click Statistics Panel */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Estadísticas de Clics</p>
        </div>

        {loadingStats ? (
          // Loading State
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : stats ? (
          // Stats Display
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-blue-700 dark:text-blue-300 font-medium text-lg">{stats.total}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Total</p>
            </div>
            <div>
              <p className="text-blue-700 dark:text-blue-300 font-medium text-lg">{stats.nonBots}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Reales</p>
            </div>
            <div>
              <p className="text-blue-700 dark:text-blue-300 font-medium text-lg">{stats.bots}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Bots</p>
            </div>
          </div>
        ) : (
          // Error State
          <p className="text-xs text-blue-600 dark:text-blue-400">No se pudieron cargar las estadísticas</p>
        )}
      </div>

      {/* Original URL (Collapsible) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
          Ver URL original
        </summary>
        <div className="mt-2 bg-muted px-2 py-1 rounded font-mono break-all text-xs border">{longUrl}</div>
      </details>
    </div>
  );
}
