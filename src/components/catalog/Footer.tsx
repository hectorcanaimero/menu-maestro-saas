import { useStore } from "@/contexts/StoreContext";
import { Phone, Mail, MapPin } from "lucide-react";

export const Footer = () => {
  const { store } = useStore();

  if (!store) return null;

  return (
    <footer className="bg-card border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">{store.name}</h3>
            {store.description && (
              <p className="text-sm text-muted-foreground">{store.description}</p>
            )}
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Contacto</h3>
            <div className="space-y-2 text-sm">
              {store.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{store.phone}</span>
                </div>
              )}
              {store.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{store.email}</span>
                </div>
              )}
              {store.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{store.address}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Horarios</h3>
            <p className="text-sm text-muted-foreground">
              Pedidos en línea disponibles 24/7
            </p>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {store.name}. Todos los derechos reservados.</p>
          <p className="mt-2">Powered by PideAI</p>
        </div>
      </div>
    </footer>
  );
};
