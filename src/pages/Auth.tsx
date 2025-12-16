import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { getSubdomainFromHostname, getCurrentDomain } from '@/lib/subdomain-validation';

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', fullName: '' });

  useEffect(() => {
    // Check current session
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Verify user is on their own store subdomain
        const currentSubdomain = getSubdomainFromHostname();
        const { data: userStore } = await supabase.rpc('get_user_owned_store').single();

        if (userStore && userStore.subdomain === currentSubdomain) {
          navigate('/admin');
        } else if (userStore) {
          // User has session but on wrong subdomain
          const currentDomain = getCurrentDomain();
          toast.error(`Debes acceder desde tu tienda: ${userStore.subdomain}.${currentDomain}`);
          await supabase.auth.signOut();
        }
      }
    };
    checkUser();

    // Listen for auth changes - Don't auto-redirect here
    // The redirect is handled explicitly in handleLogin after validation
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Don't auto-redirect on SIGNED_IN - validation happens in handleLogin
      if (event === 'SIGNED_OUT') {
        // Clear any stored data
        console.log('User signed out');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current subdomain
      const currentSubdomain = getSubdomainFromHostname();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Credenciales incorrectas');
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        toast.error('Error al iniciar sesión');
        setIsLoading(false);
        return;
      }
      console.log('data', data);
      // Verify user owns a store and that it matches the current subdomain
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      // Debug logging in development
      if (import.meta.env.DEV) {
        console.log('[AUTH DEBUG]', {
          email: loginData.email,
          userId,
          subdomain: currentSubdomain,
        });
      }

      const { data: userStore, error: storeError } = await supabase.rpc('get_user_owned_store').single();

      // Debug RPC result
      if (import.meta.env.DEV) {
        console.log('[AUTH DEBUG] RPC get_user_owned_store:', { userStore, storeError });
      }

      if (!userStore) {
        // User doesn't own any store - log them out and show error
        await supabase.auth.signOut();

        // More specific error message
        const errorMsg = storeError
          ? `Error al verificar tienda: ${storeError.message}`
          : `No se encontró tienda asociada a ${loginData.email}. Verifica que el owner_id de tu tienda coincida con tu user_id: ${userId}`;

        toast.error(errorMsg, { duration: 8000 });
        console.error('[AUTH ERROR]', { userId, email: loginData.email, error: storeError });

        setIsLoading(false);
        navigate('/create-store');
        return;
      }

      // Check if user is trying to login to their own store
      if (userStore.subdomain !== currentSubdomain) {
        // User is trying to login to a different store - not allowed!
        await supabase.auth.signOut();
        const currentDomain = getCurrentDomain();
        toast.error(`Solo puedes iniciar sesión en tu propia tienda: ${userStore.subdomain}.${currentDomain}`, {
          duration: 6000,
        });
        setIsLoading(false);
        return;
      }

      // Success - user is logging into their own store
      toast.success('¡Bienvenido!');
      navigate('/admin');
    } catch (error) {
      console.error('Error during login:', error);
      toast.error('Error al iniciar sesión');
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            full_name: signupData.fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este correo ya está registrado');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Redirect to email verification page with context
        navigate('/verify-email', {
          state: {
            email: signupData.email,
            nextStep: '/create-store', // Where to go after verification
          },
        });
      }
    } catch (error) {
      toast.error('Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Panel de Administración</CardTitle>
          <CardDescription className="text-center">Accede para gestionar tu menú de restaurante</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo Electrónico</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
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
                </div>
                <div className="flex items-center justify-between">
                  <div></div>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm px-0"
                    onClick={() => navigate('/reset-password')}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Tu nombre"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo Electrónico</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
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
                  <PasswordStrengthMeter password={signupData.password} className="mt-2" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
