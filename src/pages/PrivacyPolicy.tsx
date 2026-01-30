import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.svg';

const PrivacyPolicy = () => {
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
        <h1 className="text-4xl font-bold mb-2">Políticas de Privacidad</h1>
        <p className="text-muted-foreground mb-8">Última actualización: 29 de enero de 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <p className="text-lg">
            En PideAí, valoramos y respetamos la privacidad de nuestros usuarios, clientes y visitantes.
            La presente Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y
            protegemos la información personal y comercial que se maneja dentro de nuestra plataforma.
          </p>

          <p className="font-medium text-primary">
            El uso de PideAí implica la aceptación de estas políticas.
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. ¿Qué es PideAí?</h2>
            <p>
              PideAí es una plataforma digital que permite a negocios (principalmente de comida, pero no
              exclusivamente) crear un catálogo o sistema de pedidos en línea, gestionar órdenes, clientes,
              pagos y comunicaciones, así como ofrecer una experiencia de compra clara y organizada a sus clientes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Información que Recopilamos</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">2.1 Información del negocio (tienda)</h3>
            <p>Cuando un usuario crea una tienda en PideAí, podemos recopilar:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Nombre del negocio</li>
              <li>Correo electrónico del propietario o administrador</li>
              <li>Número telefónico</li>
              <li>Dirección del negocio (opcional)</li>
              <li>Horarios de atención</li>
              <li>Logo, imágenes y contenido del menú o catálogo</li>
              <li>Configuración de métodos de pago y monedas</li>
              <li>Información operativa relacionada con pedidos</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">2.2 Información de clientes finales</h3>
            <p>Cuando un cliente realiza un pedido a través de una tienda en PideAí, se recopila información como:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Nombre</li>
              <li>Número de teléfono</li>
              <li>Correo electrónico (si aplica)</li>
              <li>Dirección de entrega (si aplica)</li>
              <li>Detalles del pedido</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Esta información pertenece al negocio que recibe el pedido y es utilizada únicamente para
              procesar y completar la orden.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">2.3 Información técnica y de uso</h3>
            <p>De forma automática, recopilamos información como:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Dirección IP</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Fechas y horas de acceso</li>
              <li>Interacciones dentro de la plataforma</li>
              <li>Estadísticas de visitas al catálogo</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Esta información se utiliza exclusivamente para fines de seguridad, analítica y mejora del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Uso de la Información</h2>
            <p>La información recopilada se utiliza para:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Proveer y operar la plataforma PideAí</li>
              <li>Permitir la creación y gestión de tiendas</li>
              <li>Procesar pedidos y mostrar estados de orden</li>
              <li>Enviar notificaciones relacionadas con pedidos (por ejemplo, vía WhatsApp si el negocio lo habilita)</li>
              <li>Brindar soporte técnico</li>
              <li>Mejorar la experiencia del usuario</li>
              <li>Analizar el uso de la plataforma y su rendimiento</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Uso de Servicios de Terceros</h2>
            <p>PideAí utiliza servicios de terceros para el correcto funcionamiento de la plataforma, tales como:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Servicios de alojamiento y bases de datos</li>
              <li>Servicios de analítica</li>
              <li>Servicios de mensajería (como enlaces o integraciones con WhatsApp)</li>
              <li>Servicios de mapas y geolocalización (si el negocio usa delivery)</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Estos servicios solo tienen acceso a la información estrictamente necesaria para cumplir su
              función y operan bajo sus propias políticas de privacidad.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Protección de la Información</h2>
            <p>Implementamos medidas técnicas y organizativas razonables para proteger la información contra:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Accesos no autorizados</li>
              <li>Alteración</li>
              <li>Divulgación indebida</li>
              <li>Pérdida de datos</li>
            </ul>
            <p className="mt-3">
              El acceso a la información de cada tienda está aislado y protegido, evitando que otros
              negocios puedan visualizar datos que no les pertenecen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Plan Gratuito y Eliminación de Datos por Inactividad</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">6.1 Tiendas en plan gratuito</h3>
            <p>Con el objetivo de mantener la plataforma organizada y evitar el almacenamiento innecesario de datos:</p>
            <p className="mt-3">
              Las tiendas creadas bajo el plan gratuito que no presenten actividad durante un período
              continuo de <strong>30 días</strong> podrán ser desactivadas automáticamente.
            </p>
            <p className="mt-3">Una tienda se considera inactiva cuando no registra acciones relevantes como:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Acceso al panel de administración</li>
              <li>Edición de productos o información</li>
              <li>Visualizaciones significativas del catálogo</li>
              <li>Recepción de pedidos</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">6.2 Eliminación de datos</h3>
            <p>Una vez desactivada una tienda gratuita por inactividad:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>La información asociada podrá ser eliminada de forma permanente</li>
              <li>PideAí no garantiza la recuperación de los datos eliminados</li>
              <li>El usuario podrá crear una nueva tienda posteriormente, comenzando desde cero</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Esta medida busca proteger la plataforma de usos meramente exploratorios o abusivos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Planes Pagos y Retención de Datos</h2>
            <p>Las tiendas con un plan activo de pago:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Mantienen su información mientras el plan esté vigente</li>
              <li>En caso de cancelación, los datos podrán conservarse por un período limitado antes de
                su eliminación definitiva, de acuerdo con las políticas internas de retención</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Derechos del Usuario</h2>
            <p>Los usuarios tienen derecho a:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Acceder a su información</li>
              <li>Modificar o actualizar sus datos</li>
              <li>Solicitar la eliminación de su cuenta y tienda</li>
              <li>Solicitar información sobre el uso de sus datos</li>
            </ul>
            <p className="mt-4">
              Estas solicitudes pueden realizarse escribiendo a:{' '}
              <a href="mailto:soporte@pideai.com" className="text-primary hover:underline">
                soporte@pideai.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Privacidad de Menores</h2>
            <p>
              PideAí no está dirigido a menores de edad. No recopilamos conscientemente información
              personal de menores de 18 años.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Cambios en esta Política</h2>
            <p>
              PideAí se reserva el derecho de modificar estas Políticas de Privacidad en cualquier momento.
              Cualquier cambio será publicado en esta página y entrará en vigencia desde su publicación.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contacto</h2>
            <p>Si tienes dudas o consultas relacionadas con esta Política de Privacidad, puedes contactarnos a:</p>
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

export default PrivacyPolicy;
