import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.svg';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="PideAí" className="h-10 w-auto" />
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Términos y Condiciones de Uso</h1>
        <p className="text-muted-foreground mb-8">Última actualización: 29 de enero de 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <p className="text-lg">
            Bienvenido a PideAí. Al acceder, registrarte o utilizar nuestra plataforma, aceptas de forma
            expresa estos Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, debes
            abstenerte de utilizar el servicio.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Definición del Servicio</h2>
            <p>
              PideAí es una plataforma digital que permite a negocios crear catálogos y/o sistemas de
              pedidos en línea, gestionar órdenes, clientes y comunicaciones, y ofrecer una experiencia
              de compra organizada a sus clientes finales.
            </p>
            <p className="mt-3 p-4 bg-muted rounded-lg">
              <strong>Importante:</strong> PideAí no es un intermediario comercial, ni participa en la
              preparación, entrega, facturación o cobro directo de los productos ofrecidos por los negocios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Usuarios de la Plataforma</h2>
            <p>Existen tres tipos principales de usuarios:</p>
            <ul className="list-disc pl-6 space-y-3 mt-3">
              <li>
                <strong>Usuarios comerciantes o dueños de tiendas:</strong> personas naturales o jurídicas
                que crean y administran una tienda en PideAí.
              </li>
              <li>
                <strong>Clientes finales:</strong> personas que realizan pedidos a través de una tienda
                creada en PideAí.
              </li>
              <li>
                <strong>Usuarios operativos (ej. repartidores):</strong> cuando el negocio habilita estas funciones.
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Cada usuario es responsable del uso que haga de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Registro y Cuenta</h2>
            <p>Para crear una tienda en PideAí, el usuario debe:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Proporcionar información veraz y actualizada</li>
              <li>Ser mayor de edad</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              PideAí se reserva el derecho de suspender o cancelar cuentas que proporcionen información
              falsa, incompleta o que incumplan estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Responsabilidades del Comerciante</h2>
            <p>El comerciante es el único responsable de:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>La veracidad de los productos, precios, descripciones e imágenes publicadas</li>
              <li>La preparación, calidad y entrega de los pedidos</li>
              <li>El cumplimiento de normativas sanitarias, fiscales y comerciales aplicables</li>
              <li>La atención al cliente final</li>
              <li>La gestión de pagos y métodos de cobro</li>
            </ul>
            <p className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200">
              PideAí no garantiza ventas, pedidos mínimos ni ingresos para el comerciante.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Responsabilidades de los Clientes Finales</h2>
            <p>Los clientes que realicen pedidos a través de PideAí aceptan que:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>El contrato de compra se realiza directamente con el negocio, no con PideAí</li>
              <li>Cualquier reclamo sobre productos, precios, entregas o devoluciones debe hacerse
                directamente al comercio</li>
              <li>PideAí no asume responsabilidad por incumplimientos del negocio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Plan Gratuito y Planes Pagos</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">6.1 Plan gratuito</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>PideAí ofrece un plan gratuito con funcionalidades limitadas</li>
              <li>El uso del plan gratuito está sujeto a restricciones técnicas y operativas, las cuales
                pueden modificarse en cualquier momento</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">6.2 Inactividad y eliminación de datos</h3>
            <p>Las tiendas creadas bajo el plan gratuito que permanezcan inactivas por un período
              continuo de <strong>30 días</strong> podrán ser:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Desactivadas automáticamente</li>
              <li>Eliminadas junto con su información asociada</li>
            </ul>
            <p className="mt-3 text-destructive font-medium">
              Una vez eliminados, los datos no podrán ser recuperados.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">6.3 Planes pagos</h3>
            <p>
              Los planes pagos ofrecen funcionalidades adicionales y mayor capacidad de uso.
              El pago del plan no exime al comerciante de cumplir estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Pagos y Facturación</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Los pagos por suscripción no son reembolsables, salvo disposición expresa por escrito</li>
              <li>PideAí se reserva el derecho de modificar precios y planes, notificándolo previamente</li>
              <li>El incumplimiento de pago puede ocasionar la suspensión del servicio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Uso Adecuado de la Plataforma</h2>
            <p>Queda estrictamente prohibido:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Utilizar PideAí para actividades ilegales</li>
              <li>Publicar contenido ofensivo, fraudulento o engañoso</li>
              <li>Intentar acceder sin autorización a sistemas, datos o cuentas de terceros</li>
              <li>Utilizar la plataforma para pruebas masivas, scraping o usos abusivos</li>
            </ul>
            <p className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              El incumplimiento podrá resultar en la suspensión o eliminación inmediata de la cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Propiedad Intelectual</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>La plataforma PideAí, su software, diseño, logotipo y marca son propiedad exclusiva de PideAí</li>
              <li>El comerciante conserva los derechos sobre su contenido (menús, imágenes, textos)</li>
              <li>Al usar la plataforma, el comerciante otorga a PideAí una licencia limitada para mostrar
                dicho contenido dentro del servicio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Limitación de Responsabilidad</h2>
            <p>PideAí no será responsable por:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Fallas en la conexión a internet del usuario</li>
              <li>Pérdidas económicas derivadas del uso o imposibilidad de uso del servicio</li>
              <li>Errores cometidos por los comerciantes o clientes</li>
              <li>Conflictos entre comerciantes y clientes finales</li>
            </ul>
            <p className="mt-3 font-medium">
              El uso de la plataforma se realiza bajo responsabilidad exclusiva del usuario.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Suspensión y Terminación del Servicio</h2>
            <p>PideAí podrá suspender o cancelar cuentas sin previo aviso cuando:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Se incumplan estos Términos y Condiciones</li>
              <li>Exista uso indebido de la plataforma</li>
              <li>Sea requerido por autoridad competente</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              El usuario puede solicitar la cancelación de su cuenta en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Modificaciones</h2>
            <p>
              PideAí se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.
              Las modificaciones entrarán en vigencia desde su publicación en el sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Legislación Aplicable</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes aplicables del país donde opere PideAí,
              sin perjuicio de normas internacionales de protección de datos cuando corresponda.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contacto</h2>
            <p>Para consultas relacionadas con estos Términos y Condiciones, puedes contactarnos a:</p>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:soporte@pideai.com" className="text-primary hover:underline">
                  soporte@pideai.com
                </a>
              </p>
              <p>
                <strong>Web:</strong>{' '}
                <a href="https://www.pideai.com" className="text-primary hover:underline">
                  www.pideai.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PideAí. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default TermsConditions;
