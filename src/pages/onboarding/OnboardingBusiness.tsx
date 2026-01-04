import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { ArrowRight, ArrowLeft, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

const CURRENCIES = [
  { value: 'USD', label: 'Dólar Estadounidense (USD)', symbol: '$' },
  { value: 'BRL', label: 'Real Brasileño (BRL)', symbol: 'R$' },
  { value: 'MXN', label: 'Peso Mexicano (MXN)', symbol: '$' },
  { value: 'COP', label: 'Peso Colombiano (COP)', symbol: '$' },
  { value: 'ARS', label: 'Peso Argentino (ARS)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
];

const OnboardingBusiness = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    email: '',
    logoUrl: '',
    currency: 'USD',
    operatingModes: {
      delivery: true,
      pickup: false,
    },
    isFoodBusiness: true,
  });

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

      // Load saved data from localStorage if exists
      const savedData = localStorage.getItem('onboarding_business');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        if (parsed.logoUrl) {
          setLogoPreview(parsed.logoUrl);
        }
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sesión expirada');
        navigate('/auth');
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('store-assets').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('store-assets').getPublicUrl(filePath);

      setFormData({ ...formData, logoUrl: publicUrl });
      setLogoPreview(URL.createObjectURL(file));
      toast.success('Logo subido correctamente');
    } catch (error) {
      toast.error('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoUrl: '' });
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOperatingModeChange = (mode: 'delivery' | 'pickup', checked: boolean) => {
    setFormData({
      ...formData,
      operatingModes: {
        ...formData.operatingModes,
        [mode]: checked,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one operating mode is selected
    if (!formData.operatingModes.delivery && !formData.operatingModes.pickup) {
      toast.error('Debes seleccionar al menos un modo de funcionamiento');
      return;
    }

    setLoading(true);

    try {
      // Save to localStorage for next step
      localStorage.setItem('onboarding_business', JSON.stringify(formData));

      toast.success('Información guardada');
      navigate('/onboarding/subdomain');
    } catch (error) {
      toast.error('Error al guardar la información');
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
    <OnboardingLayout
      currentStep={2}
      title="Información del Negocio"
      description="Configura los detalles de tu empresa"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Logo del Negocio</Label>
          {logoPreview ? (
            <Card className="relative p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-cover rounded-md border" />
                <div>
                  <p className="text-sm font-medium">Logo cargado</p>
                  <p className="text-xs text-muted-foreground">Haz clic en X para cambiar</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </Card>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              {uploadingLogo ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Subiendo logo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Haz clic para subir tu logo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG hasta 2MB</p>
                </div>
              )}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          <p className="text-xs text-muted-foreground">Opcional: Este logo aparecerá en tu menú digital</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName">Nombre del Negocio *</Label>
          <Input
            id="businessName"
            type="text"
            placeholder="Restaurante El Sabor"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            required
            autoFocus={!logoPreview}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email de Contacto *</Label>
          <Input
            id="email"
            type="email"
            placeholder="contacto@mirestaurante.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">Este email aparecerá en tu menú digital para consultas</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección *</Label>
          <Textarea
            id="address"
            placeholder="Av. Principal 123, Centro, Ciudad"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            rows={3}
          />
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda *</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona la moneda" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Moneda utilizada para mostrar los precios en tu tienda</p>
        </div>

        {/* Operating Modes */}
        <div className="space-y-3">
          <Label>Modo de Funcionamiento *</Label>
          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="delivery"
                checked={formData.operatingModes.delivery}
                onCheckedChange={(checked) => handleOperatingModeChange('delivery', checked as boolean)}
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="delivery"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Delivery
                </label>
                <p className="text-xs text-muted-foreground">Entrega a domicilio</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="pickup"
                checked={formData.operatingModes.pickup}
                onCheckedChange={(checked) => handleOperatingModeChange('pickup', checked as boolean)}
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="pickup"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Entrega en tienda
                </label>
                <p className="text-xs text-muted-foreground">Cliente recoge en el local</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Selecciona los modos en que funciona tu negocio (puedes seleccionar varios)
          </p>
        </div>

        {/* Food Business Type */}
        <div className="space-y-3">
          <Label>Tipo de Empresa</Label>
          <div className="flex items-start space-x-3 border rounded-lg p-4">
            <Checkbox
              id="isFoodBusiness"
              checked={formData.isFoodBusiness}
              onCheckedChange={(checked) => setFormData({ ...formData, isFoodBusiness: checked as boolean })}
            />
            <div className="space-y-1 leading-none">
              <label
                htmlFor="isFoodBusiness"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Negocio de Comida
              </label>
              <p className="text-xs text-muted-foreground">
                Activa esta opción si tu negocio es de comida. Esto mostrará características específicas como el menú de
                cocina.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/onboarding/personal')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Atrás
          </Button>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default OnboardingBusiness;
