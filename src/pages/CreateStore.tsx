import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Store, ArrowLeft, CheckCircle2, XCircle, Loader2, Globe, Copy } from 'lucide-react';
import {
  validateSubdomainFormat,
  generateSubdomainSuggestions,
  getCurrentDomain,
  formatSubdomainDisplay,
} from '@/lib/subdomain-validation';
import { ProgressSteps } from '@/components/ui/progress-steps';

const CreateStore = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [validatingSubdomain, setValidatingSubdomain] = useState(false);
  const [subdomainValidation, setSubdomainValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    subdomain: '',
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.info('Primero debes crear una cuenta');
        navigate('/auth');
        return;
      }

      // Check if user already has a store
      const { data: userStore } = await supabase.rpc('get_user_owned_store').single();

      if (userStore) {
        // User already has a store - log them out and redirect to auth
        await supabase.auth.signOut();
        toast.error('Ya tienes una tienda creada. Por favor, inicia sesión en tu tienda existente.');
        navigate('/auth');
        return;
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const validateSubdomainServer = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainValidation(null);
      return;
    }

    setValidatingSubdomain(true);
    try {
      // First, client-side validation
      const clientValidation = validateSubdomainFormat(subdomain);
      if (!clientValidation.isValid) {
        setSubdomainValidation({
          isValid: false,
          message: clientValidation.errorMessage || 'Subdomain inválido',
        });
        setValidatingSubdomain(false);
        return;
      }

      // Then, server-side validation
      const { data, error } = await supabase.rpc('validate_subdomain', {
        p_subdomain: subdomain,
      });

      if (error) {
        return;
      }

      const result = data?.[0];
      setSubdomainValidation({
        isValid: result?.is_valid || false,
        message: result?.error_message || (result?.is_valid ? '✓ Disponible' : 'No disponible'),
      });

      // Generate suggestions if invalid
      if (!result?.is_valid && formData.name) {
        const newSuggestions = generateSubdomainSuggestions(formData.name);
        setSuggestions(newSuggestions);
      }
    } catch (error) {
      setSubdomainValidation({
        isValid: false,
        message: 'Error al validar el subdominio',
      });
    } finally {
      setValidatingSubdomain(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    const normalized = value.toLowerCase().trim();
    setFormData({ ...formData, subdomain: normalized });

    // Debounce validation
    if (normalized.length >= 3) {
      const timeoutId = setTimeout(() => {
        validateSubdomainServer(normalized);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSubdomainValidation(null);
    }
  };

  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });

    // Auto-generate subdomain suggestion
    if (value.length >= 3 && !formData.subdomain) {
      const newSuggestions = generateSubdomainSuggestions(value);
      if (newSuggestions.length > 0) {
        setFormData({ ...formData, name: value, subdomain: newSuggestions[0] });
        validateSubdomainServer(newSuggestions[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Debes iniciar sesión para crear una tienda');
      navigate('/auth');
      return;
    }

    // Final validation check
    if (!subdomainValidation?.isValid) {
      toast.error('Por favor, elige un subdominio válido');
      return;
    }

    setLoading(true);
    try {
      // Server-side validation will also be enforced by DB constraints and triggers
      const { data, error } = await supabase
        .from('stores')
        .insert([
          {
            subdomain: formData.subdomain.toLowerCase(),
            name: formData.name,
            owner_id: session.user.id,
            description: formData.description || null,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Este subdominio ya está en uso');
        } else if (error.message?.includes('reserved')) {
          toast.error('Este subdominio está reservado y no puede ser usado');
        } else if (error.message?.includes('format')) {
          toast.error('El formato del subdominio no es válido');
        } else {
          throw error;
        }
        return;
      }

      // For development, save subdomain to localStorage
      localStorage.setItem('dev_subdomain', formData.subdomain);

      toast.success('¡Tienda creada con éxito!');
      navigate('/admin/dashboard');
      window.location.reload(); // Reload to apply new store context
    } catch (error) {
      toast.error('Error al crear la tienda');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { title: 'Crear Cuenta', description: 'Registro y verificación' },
    { title: 'Configurar Tienda', description: 'Detalles de tu negocio' },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              <CardTitle>Crear Tu Tienda Online</CardTitle>
            </div>
            <CardDescription>Configura tu menú digital y comienza a recibir pedidos en línea</CardDescription>
            <ProgressSteps steps={steps} currentStep={1} className="mt-6" />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Tienda *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Mi Restaurante"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdominio *</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      placeholder="mitienda"
                      required
                      pattern="[a-z0-9-]+"
                      className={
                        subdomainValidation ? (subdomainValidation.isValid ? 'border-green-500' : 'border-red-500') : ''
                      }
                    />
                    {validatingSubdomain && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!validatingSubdomain && subdomainValidation && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {subdomainValidation.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">.{getCurrentDomain()}</span>
                </div>
                {subdomainValidation && (
                  <p className={`text-xs ${subdomainValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {subdomainValidation.message}
                  </p>
                )}
                {!subdomainValidation && (
                  <p className="text-xs text-muted-foreground">
                    Mínimo 3 caracteres. Solo letras minúsculas, números y guiones.
                  </p>
                )}
                {suggestions.length > 0 && !subdomainValidation?.isValid && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-foreground mb-2">Sugerencias disponibles:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, subdomain: suggestion });
                            validateSubdomainServer(suggestion);
                          }}
                          className="text-sm px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-medium rounded-md transition-colors"
                          aria-label={`Usar subdominio ${suggestion}`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* URL Preview when subdomain is valid */}
              {subdomainValidation?.isValid && formData.subdomain && (
                <Alert className="border-green-200 bg-green-50">
                  <Globe className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">¡Tu tienda estará disponible en!</AlertTitle>
                  <AlertDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-sm bg-white px-2 py-1 rounded border flex-1">
                        {formatSubdomainDisplay(formData.subdomain)}
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(formatSubdomainDisplay(formData.subdomain));
                          toast.success('URL copiada al portapapeles');
                        }}
                        aria-label="Copiar URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe tu negocio..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de Contacto</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@mitienda.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+55 (11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección de tu negocio..."
                  rows={2}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !subdomainValidation?.isValid || validatingSubdomain}
              >
                {loading ? 'Creando...' : 'Crear Tienda'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateStore;
