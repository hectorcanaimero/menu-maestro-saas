import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, ArrowLeft } from "lucide-react";

const CreateStore = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subdomain: "",
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Debes iniciar sesión para crear una tienda");
      navigate("/auth");
      return;
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      toast.error("El subdominio solo puede contener letras minúsculas, números y guiones");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stores")
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
        if (error.code === "23505") {
          toast.error("Este subdominio ya está en uso");
        } else {
          throw error;
        }
        return;
      }

      // For development, save subdomain to localStorage
      localStorage.setItem("dev_subdomain", formData.subdomain);
      
      toast.success("¡Tienda creada con éxito!");
      navigate("/admin/dashboard");
      window.location.reload(); // Reload to apply new store context
    } catch (error) {
      console.error("Error creating store:", error);
      toast.error("Error al crear la tienda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              <CardTitle>Crear Tu Tienda Online</CardTitle>
            </div>
            <CardDescription>
              Configura tu menú digital y comienza a recibir pedidos en línea
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdominio *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) =>
                      setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })
                    }
                    placeholder="mitienda"
                    required
                    pattern="[a-z0-9-]+"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    .pideai.com
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Solo letras minúsculas, números y guiones
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Tienda *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Mi Restaurante"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contacto@mitienda.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+55 (11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Dirección de tu negocio..."
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creando..." : "Crear Tienda"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateStore;
