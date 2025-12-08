# DNS Configuration Guide - artex.lat & pideai.com

## 🔍 Diagnóstico Actual

### Estado de artex.lat

```bash
$ nslookup artex.lat
✅ RESUELVE: 104.21.38.245, 172.67.141.37 (Cloudflare)

$ nslookup www.artex.lat
❌ ERROR: NXDOMAIN - No existe registro DNS

$ nslookup totus.artex.lat
✅ RESUELVE: 104.21.38.245, 172.67.141.37 (wildcard activo)
```

### Análisis

El dominio `artex.lat` tiene:
- ✅ Registro A para dominio raíz (`artex.lat`)
- ✅ Wildcard funcionando para subdominios (`*.artex.lat`)
- ❌ **FALTA**: Registro específico para `www.artex.lat`

**Por eso** cuando accedes a `https://www.artex.lat` obtienes `DNS_PROBE_FINISHED_NXDOMAIN`.

## 🛠️ Soluciones

### Opción 1: Agregar Registro WWW (Recomendado)

En tu panel de DNS (Cloudflare, GoDaddy, etc.), agrega:

```
Type    Name    Content              TTL     Proxy Status
A       www     104.21.38.245        Auto    Proxied (Orange Cloud)
A       www     172.67.141.37        Auto    Proxied (Orange Cloud)
```

O simplemente un **CNAME**:

```
Type    Name    Content        TTL     Proxy Status
CNAME   www     artex.lat      Auto    Proxied (Orange Cloud)
```

### Opción 2: Redirigir WWW al Dominio Raíz

Si estás usando **Cloudflare**, crea una **Page Rule**:

1. Ve a **Rules** → **Page Rules**
2. Crea una nueva regla:
   - **URL**: `www.artex.lat/*`
   - **Setting**: Forwarding URL (301 Permanent Redirect)
   - **Destination**: `https://artex.lat/$1`

### Opción 3: Actualizar el Código para Manejar www

Si prefieres no agregar el registro DNS, actualiza el código para redirigir automáticamente:

```typescript
// En src/lib/subdomain-validation.ts
export function getSubdomainFromHostname(): string {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Development mode (localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return localStorage.getItem('dev_subdomain') || 'totus';
  }

  // NEW: Handle www redirect
  if (hostname.startsWith('www.')) {
    // Redirect www to non-www
    const newHostname = hostname.replace('www.', '');
    window.location.href = `${window.location.protocol}//${newHostname}${window.location.pathname}${window.location.search}`;
    return 'redirecting';
  }

  // Production mode - check all supported domains
  for (const domain of SUPPORTED_DOMAINS) {
    if (hostname.endsWith(domain) && parts.length >= 3) {
      const domainParts = domain.split('.');
      const subdomainParts = parts.slice(0, parts.length - domainParts.length);
      return subdomainParts.join('.');
    }
  }

  // Fallback
  return localStorage.getItem('dev_subdomain') || 'totus';
}
```

## 📋 Configuración DNS Completa Recomendada

### Para artex.lat (Homologación)

```dns
# Dominio raíz
Type    Name    Content              TTL     Proxy   Notas
A       @       TU_IP_SERVIDOR       Auto    ✓       Dominio principal
A       www     TU_IP_SERVIDOR       Auto    ✓       WWW redirect
A       *       TU_IP_SERVIDOR       Auto    ✓       Wildcard para subdominios

# O usando CNAME para simplicidad
CNAME   www     artex.lat            Auto    ✓
CNAME   *       artex.lat            Auto    ✓
```

### Para pideai.com (Producción)

```dns
# Dominio raíz
Type    Name    Content              TTL     Proxy   Notas
A       @       TU_IP_SERVIDOR       Auto    ✓       Dominio principal
A       www     TU_IP_SERVIDOR       Auto    ✓       WWW redirect
A       *       TU_IP_SERVIDOR       Auto    ✓       Wildcard para subdominios
```

## 🧪 Verificación Post-Configuración

Después de agregar los registros DNS, espera 5-10 minutos y verifica:

```bash
# 1. Verificar dominio raíz
nslookup artex.lat
# Debe resolver a tu IP

# 2. Verificar www
nslookup www.artex.lat
# Debe resolver a tu IP

# 3. Verificar wildcard
nslookup totus.artex.lat
# Debe resolver a tu IP

# 4. Verificar en navegador
curl -I https://www.artex.lat
# Debe retornar 200 OK (o 301 si configuraste redirect)
```

## 🔧 Configuración de Cloudflare (Si aplica)

Si estás usando **Cloudflare**:

### 1. DNS Settings

```
DNS Records:
┌────────┬──────┬───────────────────┬─────┬────────┐
│ Type   │ Name │ Content           │ TTL │ Proxy  │
├────────┼──────┼───────────────────┼─────┼────────┤
│ A      │ @    │ TU_IP_SERVIDOR    │ Auto│ ✓ ON   │
│ CNAME  │ www  │ artex.lat         │ Auto│ ✓ ON   │
│ CNAME  │ *    │ artex.lat         │ Auto│ ✓ ON   │
└────────┴──────┴───────────────────┴─────┴────────┘
```

### 2. SSL/TLS Settings

- **SSL/TLS encryption mode**: Full (strict)
- **Always Use HTTPS**: ON
- **Automatic HTTPS Rewrites**: ON

### 3. Page Rules (Opcional)

Si quieres forzar redirect de www a non-www:

```
URL Pattern: www.artex.lat/*
Settings: Forwarding URL (301)
Destination: https://artex.lat/$1
```

## 🌐 Configuración de Traefik

Si estás usando **Traefik**, actualiza las reglas para incluir www:

```yaml
labels:
  # artex.lat (staging)
  - "traefik.http.routers.pideai-staging.rule=Host(`artex.lat`) || Host(`www.artex.lat`) || HostRegexp(`{subdomain:[a-z0-9-]+}.artex.lat`)"
  - "traefik.http.routers.pideai-staging.tls=true"
  - "traefik.http.routers.pideai-staging.tls.certresolver=letsencrypt"

  # pideai.com (production)
  - "traefik.http.routers.pideai-prod.rule=Host(`pideai.com`) || Host(`www.pideai.com`) || HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`)"
  - "traefik.http.routers.pideai-prod.tls=true"
  - "traefik.http.routers.pideai-prod.tls.certresolver=letsencrypt"
```

## 🚨 Troubleshooting

### Error: DNS_PROBE_FINISHED_NXDOMAIN

**Causa**: No existe registro DNS para ese dominio/subdominio.

**Solución**:
1. Verifica que agregaste el registro A o CNAME
2. Espera 5-10 minutos para propagación DNS
3. Limpia caché DNS: `ipconfig /flushdns` (Windows) o `sudo dscacheutil -flushcache` (Mac)

### Error: ERR_SSL_VERSION_OR_CIPHER_MISMATCH

**Causa**: Certificado SSL no válido o no configurado.

**Solución**:
1. Si usas Cloudflare: Activa proxy (orange cloud)
2. Si usas Traefik: Verifica que Let's Encrypt esté generando certificados
3. Espera 2-5 minutos para que se genere el certificado

### Error: 502 Bad Gateway

**Causa**: DNS resuelve pero el servidor no responde.

**Solución**:
1. Verifica que tu servidor esté corriendo: `docker ps`
2. Verifica Traefik logs: `docker logs traefik`
3. Verifica que el servicio esté healthy: `docker service ls`

## 📊 Estado Actual vs Deseado

### Antes (Estado Actual)

```
✅ artex.lat              → 104.21.38.245 (Cloudflare)
❌ www.artex.lat          → NXDOMAIN (No existe)
✅ totus.artex.lat        → 104.21.38.245 (Cloudflare)
✅ cualquier.artex.lat    → 104.21.38.245 (Cloudflare)
```

### Después (Estado Deseado)

```
✅ artex.lat              → TU_IP_SERVIDOR
✅ www.artex.lat          → TU_IP_SERVIDOR (o redirect a artex.lat)
✅ totus.artex.lat        → TU_IP_SERVIDOR
✅ cualquier.artex.lat    → TU_IP_SERVIDOR
```

## 🎯 Acción Inmediata Requerida

**Para resolver el error `DNS_PROBE_FINISHED_NXDOMAIN` en `www.artex.lat`:**

1. **Accede a tu panel de DNS** (Cloudflare, GoDaddy, Namecheap, etc.)

2. **Agrega uno de estos registros:**

   **Opción A - CNAME (Más simple)**:
   ```
   Type: CNAME
   Name: www
   Target: artex.lat
   TTL: Auto
   ```

   **Opción B - A Record**:
   ```
   Type: A
   Name: www
   IPv4: 104.21.38.245  (o tu IP de servidor)
   TTL: Auto
   ```

3. **Espera 5-10 minutos** para propagación DNS

4. **Verifica**:
   ```bash
   nslookup www.artex.lat
   ```

5. **Prueba en navegador**:
   ```
   https://www.artex.lat
   ```

## 📞 Soporte

Si después de agregar los registros DNS sigues teniendo problemas:

1. Verifica con herramientas online:
   - https://dnschecker.org/
   - https://www.whatsmydns.net/

2. Contacta a tu proveedor de DNS para verificar configuración

3. Revisa los logs de Traefik/Nginx para errores de certificado SSL
