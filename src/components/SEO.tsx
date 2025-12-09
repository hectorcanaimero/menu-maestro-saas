import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  canonical?: string;
}

export const SEO = ({
  title = 'PideAI - Sistema de Pedidos Online para Restaurantes con WhatsApp',
  description = 'Digitaliza tu restaurante en 5 minutos. Recibe pedidos por WhatsApp, códigos QR en mesas, cupones de descuento y delivery con GPS. 30 días gratis. 0% comisión.',
  keywords = 'pedidos online, restaurante digital, menú digital, whatsapp pedidos, códigos QR restaurante, delivery GPS, cupones descuento, promociones restaurante, POS restaurante, gestión restaurante',
  image = 'https://pideai.com/og-image.jpg',
  url = 'https://pideai.com',
  type = 'website',
  noindex = false,
  canonical,
}: SEOProps) => {
  const siteTitle = title.includes('PideAI') ? title : `${title} | PideAI`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="PideAI" />
      <meta property="og:locale" content="es_ES" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="author" content="PideAI" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Spanish" />

      {/* Geo Tags */}
      <meta name="geo.region" content="CO" />
      <meta name="geo.placename" content="Colombia" />

      {/* Mobile Web App */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="PideAI" />

      {/* Schema.org for Google */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'PideAI',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            availability: 'https://schema.org/InStock',
            description: '30 días de prueba gratis',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '500',
            bestRating: '5',
            worstRating: '1',
          },
          description: description,
          url: url,
          image: image,
          provider: {
            '@type': 'Organization',
            name: 'PideAI',
            url: 'https://pideai.com',
            logo: 'https://pideai.com/logo.svg',
            sameAs: [
              'https://www.facebook.com/pideai',
              'https://www.instagram.com/pideai',
              'https://www.linkedin.com/company/pideai',
            ],
          },
        })}
      </script>

      {/* Local Business Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'PideAI',
          description: 'Sistema de pedidos online para restaurantes',
          url: 'https://pideai.com',
          logo: 'https://pideai.com/logo.svg',
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+57-312-345-6789',
            contactType: 'Customer Service',
            areaServed: 'CO',
            availableLanguage: ['Spanish', 'English'],
          },
          sameAs: [
            'https://www.facebook.com/pideai',
            'https://www.instagram.com/pideai',
            'https://www.linkedin.com/company/pideai',
          ],
        })}
      </script>

      {/* FAQ Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '¿Cuánto cuesta PideAI?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Todos los planes incluyen 30 días de prueba gratis. Después, los planes comienzan desde $29/mes con 0% de comisión en ventas.',
              },
            },
            {
              '@type': 'Question',
              name: '¿Cómo funciona la integración con WhatsApp?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'PideAI se integra con WhatsApp para que recibas pedidos directamente en tu número. Los clientes pueden hacer pedidos escaneando el código QR o visitando tu menú digital.',
              },
            },
            {
              '@type': 'Question',
              name: '¿Necesito conocimientos técnicos?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No, PideAI está diseñado para ser muy fácil de usar. Puedes configurar tu menú digital en menos de 5 minutos sin conocimientos técnicos.',
              },
            },
          ],
        })}
      </script>
    </Helmet>
  );
};
