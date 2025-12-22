# 🔐 Troubleshooting Wildcard SSL Certificate

## ❌ Problema: "TRAEFIK DEFAULT CERT"

Cuando ves este certificado, significa que Traefik no pudo obtener el certificado de Let's Encrypt y está usando su certificado autofirmado por defecto.

## ✅ Solución para Cloudflare Global API Key

### Paso 1: Obtener tu Global API Key

1. Ve a Cloudflare Dashboard
2. Click en tu perfil (arriba derecha) → "My Profile"
3. Sección "API Tokens"
4. En "API Keys" → "Global API Key" → "View"
5. Copia la key

### Paso 2: Actualizar Traefik Configuration

**IMPORTANTE**: Con Global API Key debes usar:
```yaml
environment:
  - CF_API_EMAIL=tu_email@gmail.com    # Tu email de Cloudflare
  - CF_API_KEY=tu_global_api_key_aqui  # NO usar CF_DNS_API_TOKEN
```

**Archivo completo**: Usa [traefik-v2-global-key.yaml](traefik-v2-global-key.yaml)

### Paso 3: Preparar acme.json

```bash
# En el servidor
# Crear directorio si no existe
mkdir -p /etc/traefik/letsencrypt

# Remover acme.json anterior (si existe)
rm -f /etc/traefik/letsencrypt/acme.json
rm -f /etc/traefik/letsencrypt/acme-http.json

# Crear nuevo acme.json con permisos correctos
touch /etc/traefik/letsencrypt/acme.json
chmod 600 /etc/traefik/letsencrypt/acme.json

touch /etc/traefik/letsencrypt/acme-http.json
chmod 600 /etc/traefik/letsencrypt/acme-http.json

# Verificar permisos
ls -la /etc/traefik/letsencrypt/
# Debe mostrar:
# -rw------- 1 root root 0 ... acme.json
# -rw------- 1 root root 0 ... acme-http.json
```

### Paso 4: Deploy Traefik con la Nueva Configuración

```bash
# Editar el archivo traefik-v2-global-key.yaml
nano traefik-v2-global-key.yaml

# Reemplazar TU_GLOBAL_API_KEY_AQUI con tu key real

# Remover stack anterior
docker stack rm traefik

# Esperar que se limpie
sleep 10

# Deploy nuevo stack
docker stack deploy -c traefik-v2-global-key.yaml traefik

# Verificar que inició
docker service ls
```

### Paso 5: Verificar Logs

```bash
# Ver logs en tiempo real
docker service logs traefik_traefik -f

# Buscar errores de ACME
docker service logs traefik_traefik 2>&1 | grep -i "acme\|certificate\|cloudflare\|error" | tail -50
```

**Logs esperados (éxito)**:
```
time="..." level=info msg="Serving default certificate for request..."
time="..." level=info msg="legolog: [INFO] [*.artex.lat] acme: Obtaining bundled SAN certificate"
time="..." level=info msg="legolog: [INFO] [*.artex.lat] AuthURL: https://acme-v02.api.letsencrypt.org/..."
time="..." level=info msg="legolog: [INFO] [*.artex.lat] acme: Could not find solver for: tls-alpn-01"
time="..." level=info msg="legolog: [INFO] [*.artex.lat] acme: use dns-01 solver"
time="..." level=info msg="legolog: [INFO] [*.artex.lat] acme: Trying to solve DNS-01"
time="..." level=info msg="legolog: [INFO] [*.artex.lat] The server validated our request"
time="..." level=info msg="legolog: [INFO] [*.artex.lat] acme: Validations succeeded; requesting certificates"
time="..." level=info msg="legolog: [INFO] [*.artex.lat] Server responded with a certificate."
```

**Logs de error común**:
```
# Error de API Key inválida
time="..." level=error msg="Unable to obtain ACME certificate for domains" error="... authentication failed"

# Error de DNS no resuelve
time="..." level=error msg="Unable to obtain ACME certificate" error="... DNS problem: NXDOMAIN"

# Error de permisos en acme.json
time="..." level=error msg="Unable to get ACME account" error="... permission denied"
```

### Paso 6: Verificar Certificado Generado

```bash
# Esperar 2-3 minutos y verificar acme.json
cat /etc/traefik/letsencrypt/acme.json | jq .

# Debe mostrar algo como:
# {
#   "cloudflare": {
#     "Account": {...},
#     "Certificates": [
#       {
#         "domain": {
#           "main": "artex.lat",
#           "sans": ["*.artex.lat"]
#         },
#         "certificate": "...",
#         "key": "..."
#       }
#     ]
#   }
# }

# Si está vacío:
# {}
# Significa que no se generó el certificado
```

### Paso 7: Test desde Browser

```bash
# Acceder a tu sitio
curl -I https://www.artex.lat

# Verificar certificado
openssl s_client -connect www.artex.lat:443 -servername www.artex.lat 2>/dev/null | openssl x509 -noout -subject -issuer -dates

# Debe mostrar:
# subject=CN = artex.lat
# issuer=C = US, O = Let's Encrypt, CN = R3
# notBefore=Dec 22 ...
# notAfter=Mar 22 ...
```

## 🔍 Troubleshooting Específico

### Problema 1: "Authentication Failed" en logs

**Causa**: Global API Key incorrecta

**Solución**:
```bash
# Verificar que la Global API Key es correcta
# Probar manualmente con curl:
curl -X GET "https://api.cloudflare.com/client/v4/user" \
  -H "X-Auth-Email: knaimero@gmail.com" \
  -H "X-Auth-Key: TU_GLOBAL_API_KEY" \
  -H "Content-Type: application/json"

# Debe retornar:
# {"result":{"id":"...","email":"knaimero@gmail.com",...},"success":true}

# Si retorna error:
# {"success":false,"errors":[{"code":9103,"message":"Unknown X-Auth-Key or X-Auth-Email"}]}
# → La key o email están incorrectos
```

### Problema 2: "DNS Problem: NXDOMAIN"

**Causa**: DNS no está resolviendo el dominio

**Solución**:
```bash
# Verificar DNS desde el servidor
dig artex.lat @1.1.1.1
dig www.artex.lat @1.1.1.1

# Debe retornar tu IP del servidor
# Si no resuelve, verificar en Cloudflare Dashboard:
# 1. DNS → Records
# 2. Verificar que existan:
#    - A record: artex.lat → TU_IP
#    - A record: *.artex.lat → TU_IP (wildcard)
#    - CNAME o A record: www → artex.lat
```

### Problema 3: acme.json vacío después de 5 minutos

**Causa**: Traefik no está intentando generar certificado

**Solución**:
```bash
# 1. Verificar que los labels del servicio pideai tienen certresolver=cloudflare
docker service inspect pideai_app | jq '.[0].Spec.Labels' | grep certresolver

# Debe mostrar:
# "traefik.http.routers.pideai-https.tls.certresolver": "cloudflare"

# 2. Verificar que Traefik ve el servicio
docker service logs traefik_traefik 2>&1 | grep pideai

# 3. Forzar recreación del servicio pideai
docker service update --force pideai_app
```

### Problema 4: "Certificate has expired" o "Not valid yet"

**Causa**: Fecha/hora del servidor incorrecta

**Solución**:
```bash
# Verificar fecha del servidor
date

# Sincronizar si está incorrecta
timedatectl set-ntp true
systemctl restart systemd-timesyncd
```

## 📋 Checklist de Verificación

Antes de contactar soporte, verifica:

- [ ] Global API Key copiada correctamente (sin espacios)
- [ ] Email coincide con la cuenta de Cloudflare
- [ ] DNS propagado (dig desde el servidor muestra tu IP)
- [ ] Archivo acme.json tiene permisos 600
- [ ] Traefik logs no muestran errores de autenticación
- [ ] Puerto 80 y 443 abiertos en firewall
- [ ] Cloudflare NO está en proxy mode (nube naranja) para el DNS record
- [ ] Fecha/hora del servidor correcta

## 🎯 Solución Alternativa: HTTP-01 Challenge

Si el DNS-01 sigue sin funcionar, puedes usar HTTP-01 temporalmente (genera certificado individual por subdomain, no wildcard):

```bash
# En docker-compose.swarm.yml cambiar:
- "traefik.http.routers.pideai-https.tls.certresolver=letsencryptresolver"  # En lugar de cloudflare

# Redeploy
docker stack deploy -c docker-compose.swarm.yml pideai
```

**Ventajas HTTP-01**:
- Más simple, no requiere API keys
- Funciona inmediatamente

**Desventajas HTTP-01**:
- No genera wildcard (certificado individual por subdomain)
- Límite de 50 certificados/semana por dominio
- Cada nuevo subdomain necesita un certificado

## 📞 Siguiente Paso

Si después de seguir todos estos pasos sigues viendo "TRAEFIK DEFAULT CERT":

1. Exporta los logs completos:
```bash
docker service logs traefik_traefik > traefik-logs.txt
```

2. Exporta la configuración:
```bash
docker service inspect traefik_traefik > traefik-config.json
```

3. Comparte estos archivos para diagnóstico detallado.

---

**Última actualización**: Diciembre 2025
