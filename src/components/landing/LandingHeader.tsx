import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.svg';

export const LandingHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center hover:opacity-80 transition-opacity"
            aria-label="PideAI - Volver al inicio"
          >
            <img src={logo} alt="PideAI" className="h-16 w-auto" />
          </button>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-foreground hover:text-primary transition-colors"
            >
              Características
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-foreground hover:text-primary transition-colors"
            >
              Cómo Funciona
            </button>
          </nav>
          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/auth?mode=login')}>
              Accede a Plataforma
            </Button>
            <Button onClick={() => navigate('/auth?mode=signup')}>Crear Tienda Gratis</Button>
          </div>
          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
            >
              Características
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
            >
              Cómo Funciona
            </button>
            <div className="space-y-2 pt-4">
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth?mode=login')}>
                Iniciar Sesión
              </Button>
              <Button className="w-full" onClick={() => navigate('/auth?mode=signup')}>
                Crear Tienda Gratis
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
