import { Youtube, Instagram, Mail } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { FaTiktok } from 'react-icons/fa6';

export const LandingFooter = () => {
  return (
    <footer className="bg-muted/30 border-t border-border py-12 px-4">
      <div className="container mx-auto px-2 sm:px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <img src={logo} alt="PideAI" className="h-16 w-auto" />
            <p className="text-muted-foreground text-sm">
              Digitaliza tu negocio y aumenta tus ventas con nuestra plataforma todo-en-uno.
            </p>
          </div>

          {/* Producto */}
          <div>
            <h4 className="font-semibold mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Características
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  Cómo Funciona
                </a>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="https://blog.pideai.com" target="_blank" className="hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            {/* <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Términos de Servicio
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Cookies
                </a>
              </li>
            </ul> */}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PideAI. Todos los derechos reservados.
          </p>

          {/* Social Links */}
          <div className="flex gap-4">
            <a
              href="https://www.youtube.com/@PideAi"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="youtube"
              target="_blank"
            >
              <Youtube size={24} />
            </a>
            <a
              href="https://www.instagram.com/pideai"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
              target="_blank"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://www.tiktok.com/@tiendapideai"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Tik Tok"
              target="_blank"
            >
              <FaTiktok size={20} />
            </a>
            <a
              href="mailto:soporte@pideai.com"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Email"
            >
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
