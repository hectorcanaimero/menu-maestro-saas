import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, RefreshCw, CheckCircle, Info, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  // Get email and next step from navigation state
  const email = location.state?.email || "";
  const nextStep = location.state?.nextStep || "/create-store";

  useEffect(() => {
    // Check if user is already verified
    const checkVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        toast.success("¡Email verificado! Continuando...");
        navigate(nextStep);
      }
    };

    checkVerification();

    // Listen for auth state changes (when user clicks email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        toast.success("¡Email verificado exitosamente!");
        navigate(nextStep);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, nextStep]);

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user?.email_confirmed_at) {
        toast.success("¡Email verificado! Redirigiendo...");
        navigate(nextStep);
      } else {
        toast.info("Aún no hemos detectado la verificación. Por favor revisa tu correo.");
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      toast.error("Error al verificar el estado");
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("No se pudo determinar el email");
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success("Correo de verificación reenviado. Revisa tu bandeja de entrada.");
    } catch (error: any) {
      console.error("Error resending email:", error);

      if (error.message?.includes("already confirmed")) {
        toast.success("Tu email ya está verificado. Continuando...");
        navigate(nextStep);
      } else {
        toast.error("Error al reenviar el correo. Intenta nuevamente.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold">Verifica Tu Correo</CardTitle>
          <CardDescription>
            Enviamos un link de verificación a{" "}
            <strong className="text-foreground">{email || "tu correo"}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Instructions */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <AlertTitle>Próximos pasos</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                <li>Revisa tu bandeja de entrada</li>
                <li>Busca el correo de PideAI</li>
                <li>Haz clic en el link de verificación</li>
                <li>Regresarás automáticamente aquí</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* What happens next */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
            <AlertTitle>Después de verificar</AlertTitle>
            <AlertDescription className="text-sm">
              Continuarás creando tu tienda. ¡Estás a solo un paso! 🎉
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="space-y-2 pt-4">
            <Button
              onClick={handleCheckVerification}
              disabled={checking}
              variant="default"
              className="w-full"
              size="lg"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                  Ya Verifiqué Mi Correo
                </>
              )}
            </Button>

            <Button
              onClick={handleResendEmail}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                  Reenviar Correo de Verificación
                </>
              )}
            </Button>

            <Button
              onClick={() => navigate(nextStep)}
              variant="ghost"
              className="w-full"
            >
              Continuar sin verificar
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-center text-muted-foreground pt-4">
            ¿No recibiste el correo? Revisa tu carpeta de spam o correo no deseado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
