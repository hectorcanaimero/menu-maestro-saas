# 🚀 Pasos para Aplicar las Correcciones

## ✅ Correcciones Aplicadas

### 1. WWW Subdomain Fix
**Archivo**: `src/lib/subdomain-validation.ts`

**Cambio**: Modificada función `getSubdomainFromHostname()` para retornar string vacío cuando subdomain es 'www', tratándolo como dominio principal (landing page) en lugar de tienda.

```typescript
// Si es 'www', tratar como dominio principal (no es un subdomain de tienda)
if (subdomain === 'www') {
  return ''; // Retornar string vacía para indicar dominio principal
}
```

### 2. Content Security Policy Fix
**Archivo**: `docker-compose.swarm.yml`

**Cambios**:
- Agregado `worker-src 'self' blob:` para permitir PostHog web workers
- Agregado `https://us-assets.i.posthog.com` a `connect-src` para source maps

**CSP actualizado**:
```
default-src 'self' https:;
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us.i.posthog.com https://us-assets.i.posthog.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com wss://*.supabase.co;
worker-src 'self' blob:;
frame-ancestors 'self';
base-uri 'self';
form-action 'self'
```

## 📝 Pasos para Deploy

### Paso 1: Build de Nueva Imagen

Necesitas hacer build de la imagen con las variables de entorno de Supabase y PostHog:

```bash
# Configurar variables de entorno (reemplaza con tus valores reales)
export VITE_SUPABASE_PROJECT_ID=wdpexjymbiyjqwdttqhz
export VITE_SUPABASE_URL=https://wdpexjymbiyjqwdttqhz.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=tu_supabase_key_aqui
export VITE_POSTHOG_KEY=tu_posthog_key_aqui
export VITE_POSTHOG_HOST=https://us.i.posthog.com

# Build de la imagen
docker build \
  --build-arg VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
  --build-arg VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY \
  --build-arg VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST \
  -f Dockerfile.production \
  -t ghcr.io/hectorcanaimero/menu-maestro-saas:latest \
  .
```

### Paso 2: Push al Registry

```bash
# Login a GitHub Container Registry (si no estás logueado)
echo $GITHUB_TOKEN | docker login ghcr.io -u hectorcanaimero --password-stdin

# Push de la imagen
docker push ghcr.io/hectorcanaimero/menu-maestro-saas:latest
```

### Paso 3: Update del Stack en Docker Swarm

```bash
# Opción A: Forzar update para pull nueva imagen
docker service update --force --image ghcr.io/hectorcanaimero/menu-maestro-saas:latest pideai_app

# Opción B: Redeploy completo del stack
docker stack deploy -c docker-compose.swarm.yml pideai
```

### Paso 4: Verificar el Deployment

```bash
# Ver estado del servicio
docker service ps pideai_app

# Ver logs en tiempo real
docker service logs pideai_app -f --tail 100

# Esperar a que todas las replicas estén running
watch -n 2 'docker service ls'
```

### Paso 5: Testing

```bash
# Test 1: WWW debe mostrar landing page (no store)
curl -I https://www.artex.lat
# Debe retornar 200 OK

# Test 2: Dominio raíz debe mostrar landing page
curl -I https://artex.lat
# Debe retornar 200 OK

# Test 3: Subdomain debe mostrar store
curl -I https://totus.artex.lat
# Debe retornar 200 OK

# Test 4: Verificar CSP headers
curl -I https://www.artex.lat | grep -i content-security-policy
# Debe mostrar el CSP con worker-src
```

### Paso 6: Verificar en Browser

1. **Abrir https://www.artex.lat**
   - ✅ Debe cargar landing page (no store)
   - ✅ No debe mostrar error de Supabase RPC
   - ✅ Console sin errores de CSP

2. **Abrir https://artex.lat**
   - ✅ Debe cargar landing page

3. **Abrir https://totus.artex.lat** (o cualquier subdomain de tienda)
   - ✅ Debe cargar la tienda
   - ✅ PostHog debe funcionar sin errores CSP
   - ✅ Check browser console - no debe haber errores de workers bloqueados

## 🔍 Troubleshooting

### Si WWW sigue mostrando la tienda:

```bash
# 1. Verificar que la nueva imagen fue desplegada
docker service inspect pideai_app | jq '.[0].Spec.TaskTemplate.ContainerSpec.Image'
# Debe mostrar la imagen :latest con el digest actual

# 2. Verificar logs del container
docker service logs pideai_app --tail 50 | grep -i subdomain

# 3. Forzar recreación de todos los containers
docker service update --force pideai_app
```

### Si PostHog sigue dando errores CSP:

```bash
# 1. Verificar que Traefik tiene los labels correctos
docker service inspect pideai_app | jq '.[0].Spec.Labels' | grep -i contentSecurityPolicy

# 2. Ver headers en la respuesta
curl -I https://www.artex.lat

# 3. Verificar desde browser console
# Debe mostrar los headers CSP actualizados
```

### Si el servicio no actualiza:

```bash
# Ver estado de las tasks
docker service ps pideai_app --no-trunc

# Si hay tasks failed, ver por qué
docker service logs pideai_app --tail 200

# Rollback si es necesario
docker service rollback pideai_app
```

## 📊 Verificación de Éxito

Cuando el deployment esté correcto, deberías ver:

- ✅ 3/3 replicas running: `docker service ls`
- ✅ www.artex.lat → Landing page (sin errores de RPC)
- ✅ artex.lat → Landing page
- ✅ totus.artex.lat → Store de Totus
- ✅ PostHog funcionando sin errores CSP
- ✅ No errores en browser console
- ✅ Logs limpios sin errores: `docker service logs pideai_app`

## 🎯 Comandos Rápidos de Referencia

```bash
# Ver logs
docker service logs pideai_app -f

# Ver estado
docker service ps pideai_app

# Ver stats
docker stats $(docker ps -q --filter "label=com.docker.swarm.service.name=pideai_app")

# Escalar
docker service scale pideai_app=5

# Rollback
docker service rollback pideai_app

# Remover stack (cuidado!)
docker stack rm pideai
```

## 📞 Si Necesitas Ayuda

Si encuentras problemas:

1. Revisa los logs: `docker service logs pideai_app -f --tail 100`
2. Consulta [DOCKER_COMMANDS.md](DOCKER_COMMANDS.md) para troubleshooting
3. Verifica [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) para toda la configuración

---

**¿Listo para deployar?** Ejecuta los pasos en orden desde el Paso 1.
