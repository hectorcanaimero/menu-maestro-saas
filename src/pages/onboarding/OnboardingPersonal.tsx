import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { ArrowRight, Loader2 } from 'lucide-react';

const OnboardingPersonal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  // Check authentication and pre-fill data if available
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

      // Pre-fill name from user metadata if available
      if (session.user.user_metadata?.full_name) {
        setFormData((prev) => ({
          ...prev,
          fullName: session.user.user_metadata.full_name,
        }));
      }

      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/auth');
        return;
      }

      // Update user metadata with personal info
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
        },
      });

      if (error) throw error;

      // Save to localStorage for next steps
      localStorage.setItem('onboarding_personal', JSON.stringify(formData));

      toast.success('Información guardada');
      navigate('/onboarding/business');
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
    <OnboardingLayout currentStep={1} title="Información Personal" description="Cuéntanos un poco sobre ti">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre Completo *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Juan Pérez"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            autoFocus
          />
          <p className="text-xs text-muted-foreground">Este nombre aparecerá como el propietario de la tienda</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono de Contacto *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+55 (11) 99999-9999"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">Lo usaremos para notificaciones importantes sobre tu tienda</p>
        </div>

        <div className="flex justify-end pt-4">
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

export default OnboardingPersonal;
