import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { getSubdomainFromHostname, getCurrentDomain, isPlatformSubdomain } from '@/lib/subdomain-validation';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'login' or 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', fullName: '' });

  useEffect(() => {
    // Check current session ONLY on initial mount
    // Don't redirect during active login flow - that's handled in handleLogin
    let isInitialCheck = true;

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && isInitialCheck) {
        // Special handling for platform subdomain
        if (isPlatformSubdomain()) {
          // Check if user is a super_admin
          const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');
          const { data: adminRole } = await supabase.rpc('get_admin_role');

          if (isPlatformAdmin && adminRole === 'super_admin') {
            navigate('/');
          }
          // If not super_admin, stay on auth page (will show error after login attempt)
          return;
        }

        // Normal store subdomain handling
        // Verify user is on their own store subdomain
        const currentSubdomain = getSubdomainFromHostname();
        const { data: userStore } = await supabase.rpc('get_user_owned_store').single();

        if (userStore && userStore.subdomain === currentSubdomain) {
          navigate('/admin');
        } else if (userStore) {
          // User has session but on wrong subdomain - redirect them to their store
          const currentDomain = getCurrentDomain();
          const correctStoreUrl = `${window.location.protocol}//${userStore.subdomain}.${currentDomain}/admin`;
          toast.info('Redirigiendo a tu tienda...');
          window.location.href = correctStoreUrl;
        }
      }
    };
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      isInitialCheck = false; // Mark that we're past initial check

      if (event === 'SIGNED_OUT') {
        // Clear any stored data
      }
      // SIGNED_IN event redirect is handled in handleLogin, not here
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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

      // Special handling for platform subdomain - check if user is super_admin
      if (isPlatformSubdomain()) {
        const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');
        const { data: adminRole } = await supabase.rpc('get_admin_role');

        if (!isPlatformAdmin || adminRole !== 'super_admin') {
          toast.error('Acceso denegado. Solo los super administradores pueden acceder a esta plataforma.');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        toast.success('Bienvenido al panel de administracion');
        navigate('/');
        setIsLoading(false);
        return;
      }

      // Get user's store
      const { data: userStore, error: storeError } = await supabase.rpc('get_user_owned_store').single();

      // Debug logging in development
      if (import.meta.env.DEV) {
        //
      }

      if (!userStore) {
        // User doesn't own any store - redirect to onboarding
        toast.info('Completa el registro de tu tienda');
        navigate('/onboarding/personal');
        setIsLoading(false);
        return;
      }

      // Success - redirect to user's store admin with session token
      const currentDomain = getCurrentDomain();

      // Create session token for cross-subdomain transfer
      const sessionToken = btoa(
        JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          timestamp: Date.now(),
        })
      );

      // Build redirect URL with session token
      const storeAdminUrl = new URL(
        `${window.location.protocol}//${userStore.subdomain}.${currentDomain}/admin`
      );
      storeAdminUrl.searchParams.set('session_token', sessionToken);

      toast.success('¡Bienvenido! Redirigiendo a tu tienda...');

      // Redirect to the user's store admin with session token
      window.location.href = storeAdminUrl.toString();
    } catch (error) {
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
            nextStep: '/onboarding/personal', // Where to go after verification - NEW ONBOARDING FLOW
          },
        });
      }
    } catch (error) {
      toast.error('Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which tab to show based on URL parameter or default to login
  const defaultTab = mode === 'signup' ? 'signup' : 'login';
  // Show tabs only if no mode is specified
  const showTabs = !mode;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Button>
        <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Panel de Administración</CardTitle>
          <CardDescription className="text-center">Accede para gestionar tu tienda online</CardDescription>
        </CardHeader>
        <CardContent>
          {showTabs ? (
            <Tabs defaultValue={defaultTab} className="w-full">
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
          ) : (
            // Single form view when mode is specified
            <div className="w-full">
              {mode === 'login' ? (
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
              ) : (
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
              )}
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
