import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSent(true);
      toast.success('Correo enviado. Revisa tu bandeja de entrada.');
    } catch (error) {
      toast.error('Error al enviar el correo de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {emailSent ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Mail className="w-6 h-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {emailSent ? 'Correo Enviado' : 'Recuperar Contraseña'}
            </CardTitle>
            <CardDescription>
              {emailSent
                ? 'Revisa tu correo para restablecer tu contraseña'
                : 'Ingresa tu correo electrónico para recibir un link de recuperación'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 h-4 text-green-600" />
                <AlertDescription>
                  <p className="text-sm">
                    Enviamos un correo a <strong>{email}</strong> con instrucciones para restablecer tu contraseña.
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li>Revisa tu bandeja de entrada</li>
                    <li>Haz clic en el link del correo</li>
                    <li>Crea una nueva contraseña</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
                Volver al Inicio de Sesión
              </Button>

              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                variant="ghost"
                className="w-full"
              >
                Enviar a otro correo
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Link de Recuperación'}
              </Button>

              <Button type="button" onClick={() => navigate('/auth')} variant="ghost" className="w-full">
                Cancelar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
