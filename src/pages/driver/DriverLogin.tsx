import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Bike, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { H1, Body } from '@/components/ui/typography';

export default function DriverLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !pin) {
      toast.error('Ingresa tu teléfono y PIN');
      return;
    }

    setLoading(true);
    try {
      // Find driver by phone
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true)
        .single();

      if (error || !driver) {
        toast.error('Motorista no encontrado o inactivo');
        return;
      }

      // For simplicity, we'll use the last 4 digits of phone as PIN
      // In production, you should use proper authentication
      const expectedPin = phone.slice(-4);

      if (pin !== expectedPin) {
        toast.error('PIN incorrecto');
        return;
      }

      // Store driver info in localStorage
      localStorage.setItem('driver_id', driver.id);
      localStorage.setItem('driver_name', driver.name);
      localStorage.setItem('driver_phone', driver.phone);

      toast.success(`¡Bienvenido, ${driver.name}!`);
      navigate('/driver/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bike className="w-8 h-8 text-primary" />
          </div>
          <H1 className="text-2xl">Portal de Motoristas</H1>
          <CardDescription>Ingresa para ver tus entregas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+58 412 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN (últimos 4 dígitos de tu teléfono)</Label>
              <Input
                id="pin"
                type="password"
                placeholder="1234"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>

            <div className="p-3 bg-muted rounded-lg mt-4">
              <Body size="small" className="text-muted-foreground text-center">
                💡 Tu PIN son los últimos 4 dígitos de tu teléfono
              </Body>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
