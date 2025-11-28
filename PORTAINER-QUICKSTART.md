# 🚀 Portainer Quick Start - Deploy en 5 minutos

Guía visual para hacer deploy de PideAI desde Portainer.

## ✅ Pre-requisitos Rápidos

Antes de empezar, verifica que tienes:

```bash
# 1. Verificar que Swarm está inicializado
docker node ls

# 2. Verificar que Traefik está corriendo
docker service ls | grep traefik

# 3. Verificar que network_public existe
docker network ls | grep network_public

# Si no existe, crear:
docker network create --driver=overlay network_public
```

## 📋 Paso a Paso en Portainer

### 1️⃣ Acceder a Portainer

```
URL: https://portainer.tudominio.com
  o: https://TU_SERVER_IP:9443
```

Login → Seleccionar Environment (tu Docker Swarm)

---

### 2️⃣ Crear Stack

**Portainer UI:**
```
Sidebar → Stacks → + Add stack
```

**Configuración:**
- **Name**: `pideai`
- **Build method**: Web editor (seleccionado por defecto)

---

### 3️⃣ Copiar Compose File

Abre [portainer-stack.yml](portainer-stack.yml) y **copia TODO el contenido**.

**⚠️ IMPORTANTE**: Cambiar `pideai.com` por tu dominio en estas líneas:

```yaml
# Buscar y reemplazar "pideai.com" con tu dominio
- "traefik.http.routers.pideai-http.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.TU-DOMINIO.com`) || Host(`TU-DOMINIO.com`)"
- "traefik.http.routers.pideai-https.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.TU-DOMINIO.com`) || Host(`TU-DOMINIO.com`)"
```

Pegar en el **Web editor** de Portainer.

---

### 4️⃣ Deploy

Click en **Deploy the stack** (botón azul abajo)

Espera 30-60 segundos mientras:
- Descarga la imagen (~200MB)
- Crea los servicios
- Inicia los containers
- Ejecuta health checks

---

### 5️⃣ Verificar

**En Portainer:**

1. **Stacks** → `pideai`
   - Estado: Debe mostrar `1 service` activo

2. **Services** → `pideai_pideai-app`
   - Replicas: `2/2` (o las que configuraste)
   - Status: `Running`
   - Health: `Healthy` (aparece después de ~10s)

3. **Logs** (click en el servicio)
   - Deberías ver logs de nginx iniciando

---

### 6️⃣ Test

Abre en tu navegador:

```
✅ https://tienda1.tudominio.com
✅ https://tienda2.tudominio.com
✅ https://tudominio.com
```

Cada subdomain debería cargar la app y resolver el store correspondiente.

---

## 🎛️ Operaciones Comunes en Portainer

### 📊 Ver Logs

```
Services → pideai_pideai-app → Logs
```

**Opciones:**
- Last 100 lines
- Auto-refresh (útil para debugging)
- Download logs

### 📈 Ver Métricas

```
Services → pideai_pideai-app → Stats
```

Verás:
- CPU usage (%)
- Memory usage (MB)
- Network I/O (MB/s)

### ⚡ Escalar

```
Services → pideai_pideai-app → Scale service
```

Cambiar número de replicas:
- `2` → `4` (más capacidad)
- `4` → `2` (reducir costos)

Click **Scale service** → Cambio instantáneo

### 🔄 Actualizar Versión

```
Services → pideai_pideai-app → Update service
```

En **Image**, cambiar:
- De: `ghcr.io/hectorcanaimero/menu-maestro-saas:3.0.0-alpha`
- A: `ghcr.io/hectorcanaimero/menu-maestro-saas:3.1.0`

Click **Update service** → Rolling update automático (zero downtime)

### ↩️ Rollback

Si algo sale mal después de un update:

```
Services → pideai_pideai-app → Rollback service
```

Revierte a la versión anterior en segundos.

### 🔁 Reiniciar

```
Services → pideai_pideai-app → ⋮ (tres puntos) → Restart service
```

Reinicia todos los containers del servicio.

### 🗑️ Eliminar Stack

```
Stacks → pideai → Delete this stack
```

Elimina todo: servicios, containers, networks (excepto externa).

---

## 🔧 Configuraciones Útiles

### Cambiar Número de Replicas

En el **stack.yml**, modificar:

```yaml
deploy:
  replicas: 4  # Cambiar de 2 a 4
```

Guardar → **Update the stack**

### Ajustar Recursos

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'     # Aumentar CPU
      memory: 512M    # Aumentar RAM
```

### Agregar Más Dominios

Si tienes `artex.lat` y `clubecondor.com`:

```yaml
labels:
  - "traefik.http.routers.pideai-https.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`) || Host(`pideai.com`) || HostRegexp(`{subdomain:[a-z0-9-]+}.artex.lat`) || Host(`artex.lat`) || HostRegexp(`{subdomain:[a-z0-9-]+}.clubecondor.com`) || Host(`clubecondor.com`)"
```

---

## 🐛 Troubleshooting Rápido

### ❌ Stack no despliega

**Error**: `network network_public not found`

**Solución:**
```bash
# SSH al servidor
docker network create --driver=overlay network_public
```

O desde Portainer:
```
Networks → + Add network
Name: network_public
Driver: overlay
Scope: Swarm
```

### ❌ Service unhealthy

**Error**: Health check failing

**Solución:**
1. Ver logs del servicio
2. Verificar endpoint de health:
   ```
   Services → pideai_pideai-app → Console
   # Dentro del container:
   wget http://localhost/health
   ```
3. Si no existe `/health`, el health check fallará (es normal con imagen pre-built)

**Fix**: Comentar health check en stack.yml:

```yaml
# healthcheck:
#   test: ["CMD", "wget", ...]
```

### ❌ Subdomain no funciona

**Problema**: Solo `pideai.com` funciona, pero `tienda1.pideai.com` no.

**Solución**: Verificar DNS

```bash
# Desde cualquier lugar
nslookup tienda1.pideai.com

# Debe resolver a tu servidor IP
```

Si no resuelve → Configurar DNS wildcard:
```
A    *.pideai.com    →  TU_SERVER_IP
```

### ❌ SSL no funciona

**Problema**: `ERR_SSL_PROTOCOL_ERROR` o certificado inválido

**Solución**:
1. Verificar que Traefik tiene `letsencryptresolver` configurado
2. Ver logs de Traefik:
   ```
   Services → traefik → Logs
   ```
3. Buscar errores de ACME/Let's Encrypt
4. Verificar que puertos 80 y 443 están abiertos en firewall

---

## 📊 Monitoreo

### Dashboard de Portainer

```
Home → Environment → Dashboard
```

Verás:
- Total containers running
- CPU usage agregado
- Memory usage agregado
- Stacks activos

### Notificaciones

Configurar alertas:

```
Settings → Notifications → Add webhook
```

Integrar con:
- Slack
- Discord
- Microsoft Teams
- Email (SMTP)

Triggers recomendados:
- ✅ Service unhealthy
- ✅ Stack deployment failed
- ✅ Container stopped

---

## 🎯 Checklist de Deploy

Usa esta checklist para cada deploy:

- [ ] DNS configurado (A + wildcard)
- [ ] `network_public` existe
- [ ] Traefik corriendo
- [ ] Dominio cambiado en stack.yml
- [ ] Stack creado en Portainer
- [ ] Deploy ejecutado sin errores
- [ ] Service en estado `Running`
- [ ] Replicas correctas (ej: `2/2`)
- [ ] Health checks pasando (o comentados)
- [ ] Test de URL principal exitoso
- [ ] Test de subdomain exitoso
- [ ] SSL funcionando (candado verde)

---

## 🆘 Ayuda

Si tienes problemas:

1. **Ver logs en Portainer**
   - Stack logs
   - Service logs
   - Container individual logs

2. **Verificar Traefik dashboard** (si está habilitado)
   - Routers
   - Services
   - Middlewares

3. **SSH al servidor y verificar**
   ```bash
   docker service ls
   docker service ps pideai_pideai-app
   docker service logs pideai_pideai-app
   ```

---

## 📚 Siguiente Paso

Una vez que el deploy funcione:

1. **Crear stores en Supabase** (si no existen)
2. **Configurar subdominios en tu app**
3. **Agregar productos y categorías** desde `/admin`
4. **Configurar métodos de pago** en Settings
5. **Activar notificaciones** en admin panel

---

**¡Listo! Tu app multi-tenant está corriendo en producción. 🎉**

Todo gestionado desde Portainer sin necesidad de SSH o comandos manuales.
