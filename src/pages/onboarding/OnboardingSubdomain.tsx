import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Globe, Copy, Sparkles, Edit3, Check } from 'lucide-react';
import {
  validateSubdomainFormat,
  generateSubdomainSuggestions,
  getCurrentDomain,
  formatSubdomainDisplay,
} from '@/lib/subdomain-validation';

const OnboardingSubdomain = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [validatingSubdomain, setValidatingSubdomain] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [subdomain, setSubdomain] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [subdomainValidation, setSubdomainValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

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

      // Load business data
      const savedData = localStorage.getItem('onboarding_business');
      if (!savedData) {
        toast.error('Primero completa la información del negocio');
        navigate('/onboarding/business');
        return;
      }

      const businessData = JSON.parse(savedData);

      // Auto-generate subdomain from business name
      if (businessData.businessName) {
        const autoSubdomains = generateSubdomainSuggestions(businessData.businessName);
        if (autoSubdomains.length > 0) {
          const primarySubdomain = autoSubdomains[0];
          setSubdomain(primarySubdomain);
          setSuggestions(autoSubdomains.slice(1, 4)); // Show 3 alternative suggestions
          validateSubdomainServer(primarySubdomain);
        }
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const validateSubdomainServer = async (subdomainToValidate: string) => {
    if (!subdomainToValidate || subdomainToValidate.length < 3) {
      setSubdomainValidation(null);
      return;
    }

    setValidatingSubdomain(true);
    try {
      // Client-side validation first
      const clientValidation = validateSubdomainFormat(subdomainToValidate);
      if (!clientValidation.isValid) {
        setSubdomainValidation({
          isValid: false,
          message: clientValidation.errorMessage || 'Subdomain inválido',
        });
        setValidatingSubdomain(false);
        return;
      }

      // Server-side validation
      const { data, error } = await supabase.rpc('validate_subdomain', {
        p_subdomain: subdomainToValidate,
      });

      if (error) {
        console.error('Error validating subdomain:', error);
        setSubdomainValidation({
          isValid: false,
          message: 'Error al validar el subdominio',
        });
        return;
      }

      const result = data?.[0];
      setSubdomainValidation({
        isValid: result?.is_valid || false,
        message: result?.error_message || (result?.is_valid ? '✓ Disponible' : 'No disponible'),
      });
    } catch (error) {
      console.error('Error validating subdomain:', error);
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
    setSubdomain(normalized);

    if (normalized.length >= 3) {
      const timeoutId = setTimeout(() => {
        validateSubdomainServer(normalized);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSubdomainValidation(null);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setSubdomain(suggestion);
    setIsEditing(false);
    validateSubdomainServer(suggestion);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subdomainValidation?.isValid) {
      toast.error('Por favor, elige un subdominio válido');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sesión expirada');
        navigate('/auth');
        return;
      }

      // Get all saved data
      const personalData = JSON.parse(localStorage.getItem('onboarding_personal') || '{}');
      const businessData = JSON.parse(localStorage.getItem('onboarding_business') || '{}');

      // Build operating modes array
      const operatingModes = [];
      if (businessData.operatingModes?.delivery) operatingModes.push('delivery');
      if (businessData.operatingModes?.pickup) operatingModes.push('pickup');

      // Create the store
      const { data: store, error } = await supabase
        .from('stores')
        .insert([
          {
            subdomain: subdomain.toLowerCase(),
            name: businessData.businessName,
            owner_id: session.user.id,
            email: businessData.email,
            phone: personalData.phone,
            address: businessData.address,
            logo_url: businessData.logoUrl || null,
            description: businessData.businessName,
            currency: businessData.currency || 'USD',
            operating_modes: operatingModes,
            is_food_business: businessData.isFoodBusiness !== undefined ? businessData.isFoodBusiness : true,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Este subdominio ya está en uso');
          setSubdomainValidation({
            isValid: false,
            message: 'Este subdominio ya está en uso',
          });
        } else if (error.message?.includes('reserved')) {
          toast.error('Este subdominio está reservado');
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      // Clear onboarding data from localStorage
      localStorage.removeItem('onboarding_personal');
      localStorage.removeItem('onboarding_business');

      // Save subdomain to localStorage for dev mode
      localStorage.setItem('dev_subdomain', subdomain);

      toast.success('¡Tienda creada exitosamente! 🎉 Redirigiendo...');

      // Redirect to the new store's admin panel
      const currentDomain = getCurrentDomain();
      const storeAdminUrl = `${window.location.protocol}//${subdomain}.${currentDomain}/admin`;
      window.location.href = storeAdminUrl;
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error('Error al crear la tienda');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <OnboardingLayout currentStep={3} title="Tu URL Única" description="Elige la dirección web de tu tienda online">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auto-generated subdomain display */}
        {!isEditing && subdomain && (
          <Alert className="border-primary/20 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Subdominio Sugerido</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-3">
                <p className="text-sm text-muted-foreground">Basado en el nombre de tu negocio, te sugerimos:</p>
                <div className="flex items-center gap-2">
                  <code className="text-base font-semibold bg-background px-3 py-2 rounded border flex-1">
                    {subdomain}
                  </code>
                  <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Editable subdomain input */}
        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdominio *</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  placeholder="mitienda"
                  required
                  pattern="[a-z0-9-]+"
                  className={
                    subdomainValidation ? (subdomainValidation.isValid ? 'border-green-500' : 'border-red-500') : ''
                  }
                  autoFocus
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
              {subdomainValidation?.isValid && (
                <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
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
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Otras opciones disponibles:</Label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleUseSuggestion(suggestion)}
                  className="text-sm px-3 py-2 bg-background hover:bg-accent rounded-md transition-colors border border-secondary hover:border-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* URL Preview */}
        {subdomainValidation?.isValid && subdomain && !isEditing && (
          <Alert className="border-green-200 bg-green-50">
            <Globe className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Tu tienda estará disponible en:</AlertTitle>
            <AlertDescription>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-sm bg-white px-3 py-2 rounded border border-green-200 flex-1 font-medium">
                  {formatSubdomainDisplay(subdomain)}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(formatSubdomainDisplay(subdomain));
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

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/onboarding/business')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Atrás
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={loading || !subdomainValidation?.isValid || validatingSubdomain}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando tienda...
              </>
            ) : (
              <>
                Crear Mi Tienda
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default OnboardingSubdomain;
