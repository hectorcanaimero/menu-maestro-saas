import { useStore } from "@/contexts/StoreContext";
import { Phone, Mail, MapPin } from "lucide-react";

export const Footer = () => {
  const { store } = useStore();

  if (!store) return null;

  return (
    <footer className="bg-card border-t mt-8 md:mt-12">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Store Info Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl">{store.name}</h3>
            {store.description && (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {store.description}
              </p>
            )}
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl">Contacto</h3>
            <div className="space-y-3">
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-full bg-muted group-hover:bg-muted/80 transition-colors flex-shrink-0">
                    <Phone className="w-5 h-5 md:w-4 md:h-4" />
                  </div>
                  <span className="text-sm md:text-base break-all">{store.phone}</span>
                </a>
              )}
              {store.email && (
                <a
                  href={`mailto:${store.email}`}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-full bg-muted group-hover:bg-muted/80 transition-colors flex-shrink-0">
                    <Mail className="w-5 h-5 md:w-4 md:h-4" />
                  </div>
                  <span className="text-sm md:text-base break-all">{store.email}</span>
                </a>
              )}
              {store.address && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <div className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-full bg-muted flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 md:w-4 md:h-4" />
                  </div>
                  <span className="text-sm md:text-base leading-relaxed">{store.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hours Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg md:text-xl">Horarios</h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Pedidos en línea disponibles 24/7
            </p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t mt-8 md:mt-10 pt-6 md:pt-8 text-center">
          <p className="text-sm md:text-base text-muted-foreground">
            © {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
          </p>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Powered by PideAI
          </p>
        </div>
      </div>
    </footer>
  );
};
