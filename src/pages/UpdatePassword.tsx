import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidRecovery, setIsValidRecovery] = useState<boolean | null>(null);

  // Verificar si el usuario llegó desde un link de recuperación válido
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        // Obtener la sesión actual
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error verificando sesión:', error);
          setIsValidRecovery(false);
          toast.error('Link de recuperación inválido o expirado');
          return;
        }

        // Verificar si hay una sesión activa
        if (!session) {
          setIsValidRecovery(false);
          toast.error('Link de recuperación inválido o expirado');
          return;
        }

        // Si llegamos aquí, la sesión es válida
        setIsValidRecovery(true);
      } catch (error) {
        console.error('Error en checkRecoverySession:', error);
        setIsValidRecovery(false);
        toast.error('Error al verificar el link de recuperación');
      }
    };

    checkRecoverySession();

    // Listener para cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidRecovery(true);
        toast.info('Ahora puedes cambiar tu contraseña');
      } else if (event === 'SIGNED_OUT') {
        setIsValidRecovery(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidRecovery) {
      toast.error('Sesión de recuperación no válida. Por favor, solicita un nuevo link de recuperación.');
      navigate('/reset-password');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Contraseña actualizada exitosamente');

      // Cerrar sesión automáticamente después de cambiar contraseña
      await supabase.auth.signOut();

      // Redirigir a login con un mensaje de éxito
      setTimeout(() => {
        navigate('/auth');
        toast.info('Por favor, inicia sesión con tu nueva contraseña');
      }, 1000);
    } catch (error) {
      toast.error('Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  // Si aún estamos verificando, mostrar loading
  if (isValidRecovery === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <p className="text-muted-foreground">Verificando link de recuperación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si el link no es válido, mostrar error
  if (isValidRecovery === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Link Inválido</CardTitle>
            <CardDescription>
              El link de recuperación no es válido o ha expirado
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                <p className="text-sm">
                  El link de recuperación de contraseña ha expirado o ya fue utilizado.
                </p>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  <li>Los links expiran después de 1 hora</li>
                  <li>Solo pueden usarse una vez</li>
                  <li>Solicita un nuevo link de recuperación</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => navigate('/reset-password')}
              className="w-full"
            >
              Solicitar Nuevo Link
            </Button>

            <Button
              onClick={() => navigate('/auth')}
              variant="ghost"
              className="w-full"
            >
              Volver al Inicio de Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña para tu cuenta</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  aria-describedby="password-strength"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} className="mt-2" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                aria-invalid={confirmPassword && password !== confirmPassword ? true : undefined}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600" role="alert">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || password !== confirmPassword || password.length < 8}
            >
              {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;
