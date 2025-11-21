import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Store, ChefHat, ShoppingBag, Smartphone } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Store,
      title: "Tu Propia Tienda",
      description: "Crea tu menú digital personalizado con tu marca y estilo",
    },
    {
      icon: ChefHat,
      title: "Gestión Fácil",
      description: "Administra productos, categorías y pedidos desde un panel intuitivo",
    },
    {
      icon: ShoppingBag,
      title: "Recibe Pedidos",
      description: "Los clientes pueden hacer pedidos directamente desde tu catálogo",
    },
    {
      icon: Smartphone,
      title: "Acceso desde Cualquier Lugar",
      description: "Tu tienda disponible 24/7 desde cualquier dispositivo",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Bienvenido a <span className="text-primary">PideAI</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Crea tu menú digital en minutos y comienza a recibir pedidos en línea
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/create-store")}>
              Crear Mi Tienda
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">¿Por qué elegir PideAI?</h2>
          <p className="text-muted-foreground">
            Todo lo que necesitas para vender en línea
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6 p-8 rounded-lg border bg-card">
          <h2 className="text-3xl font-bold">¿Listo para empezar?</h2>
          <p className="text-muted-foreground">
            Únete a cientos de negocios que ya están vendiendo con PideAI
          </p>
          <Button size="lg" onClick={() => navigate("/create-store")}>
            Crear Mi Tienda Gratis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PideAI. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
