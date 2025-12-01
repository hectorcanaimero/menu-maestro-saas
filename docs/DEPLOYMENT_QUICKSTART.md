# Quick Start: Deploy Menu Maestro en 15 Minutos

Esta gu\u00eda r\u00e1pida te llevar\u00e1 del c\u00f3digo al deployment en producci\u00f3n en ~15 minutos.

## Pre-requisitos Listos

Aseg\u00farate de tener:
- [ ] Docker Swarm inicializado
- [ ] Traefik deployado y funcionando
- [ ] DNS configurado (wildcard `*.pideai.com` \u2192 IP del servidor)
- [ ] Puertos 80 y 443 abiertos

---

## Paso 1: Build de la Imagen (3 min)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/menu-maestro.git
cd menu-maestro

# 2. Configurar variables de entorno
cat > .env.production << EOF
VITE_SUPABASE_PROJECT_ID=wdpexjymbiyjqwdttqhz
VITE_SUPABASE_PUBLISHABLE_KEY=tu_key_aqui
VITE_SUPABASE_URL=https://wdpexjymbiyjqwdttqhz.supabase.co
VITE_POSTHOG_KEY=phc_tu_key_aqui
VITE_POSTHOG_HOST=https://us.i.posthog.com
EOF

# 3. Build y push
./scripts/build-docker-image.sh --tag v1.0.0 --push
```

---

## Paso 2: Crear Secrets (2 min)

```bash
# Ejecutar script automatizado
./scripts/setup-swarm-secrets.sh
```

---

## Paso 3: Deploy en Portainer (5 min)

### Opci\u00f3n A: Portainer UI

1. Abrir Portainer: `https://portainer.tudominio.com:9443`
2. Ir a **Stacks** \u2192 **Add stack**
3. Nombre: `pideai`
4. Copiar contenido de `docker-compose.swarm.yml`
5. **Editar estas l\u00edneas:**
   ```yaml
   # Cambiar imagen
   image: ghcr.io/TU-USUARIO/menu-maestro:v1.0.0

   # Cambiar dominio (3 lugares)
   - "...Host(`TU-DOMINIO.com`)..."
   - "...HostRegexp(`^[a-z0-9-]+\\.TU-DOMINIO\\.com$$`)..."
   ```
6. Click **Deploy the stack**

### Opci\u00f3n B: CLI

```bash
# Editar docker-compose.swarm.yml primero
vim docker-compose.swarm.yml
# (cambiar imagen y dominio)

# Deploy
./scripts/deploy-to-swarm.sh pideai
```

---

## Paso 4: Verificar (3 min)

```bash
# 1. Ver servicios
docker service ls

# 2. Ver logs
docker service logs -f pideai_app

# 3. Probar health check
curl http://tu-dominio.com/health
# Output esperado: OK

# 4. Probar HTTPS
curl -I https://tu-dominio.com
# Output esperado: HTTP/2 200

# 5. Abrir en navegador
# https://pideai.com
# https://tienda1.pideai.com
```

---

## Paso 5: Confirmar Funcionamiento (2 min)

Checklist final:

- [ ] `docker service ls` muestra 2/2 r\u00e9plicas corriendo
- [ ] Logs no muestran errores
- [ ] `https://pideai.com` carga la aplicaci\u00f3n
- [ ] `https://tienda1.pideai.com` carga tienda diferente
- [ ] Certificado SSL es v\u00e1lido (candado verde en navegador)
- [ ] No hay errores en consola del navegador

---

## Troubleshooting R\u00e1pido

### Error: "Secrets not found"
```bash
./scripts/setup-swarm-secrets.sh
```

### Error: "502 Bad Gateway"
```bash
docker service logs pideai_app
# Revisar logs para ver el error espec\u00edfico
```

### Error: "Certificate not valid"
```bash
# Verificar DNS
dig pideai.com +short

# Ver logs de Traefik
docker service logs traefik_traefik | grep acme
```

### Servicio no inicia
```bash
# Ver detalles
docker service ps pideai_app --no-trunc

# Ver logs
docker service logs pideai_app
```

---

## Actualizaci\u00f3n R\u00e1pida

```bash
# 1. Build nueva versi\u00f3n
./scripts/build-docker-image.sh --tag v1.1.0 --push

# 2. Actualizar servicio
docker service update --image ghcr.io/usuario/menu-maestro:v1.1.0 pideai_app

# 3. Monitorear
watch docker service ps pideai_app
```

---

## Comandos \u00datiles

```bash
# Ver logs en tiempo real
docker service logs -f pideai_app

# Escalar a 4 r\u00e9plicas
docker service scale pideai_app=4

# Reiniciar servicio
docker service update --force pideai_app

# Rollback
docker service rollback pideai_app

# Eliminar todo
docker stack rm pideai
```

---

## Pr\u00f3ximos Pasos

Una vez deployado:

1. **Configurar Monitoring**: Ver `docs/MONITORING.md`
2. **Setup CI/CD**: Ver `.github/workflows/docker-build.yml`
3. **Backup**: Configurar backup de configuraci\u00f3n
4. **Escalamiento**: Ajustar replicas seg\u00fan carga

---

## Ayuda

Para gu\u00edas completas ver:
- `docs/PORTAINER_DEPLOYMENT.md` - Gu\u00eda completa de deployment
- `docs/TRAEFIK_SETUP.md` - Configuraci\u00f3n detallada de Traefik

---

**Tiempo total estimado**: 15 minutos
**Dificultad**: Intermedia
**\u00daltima actualizaci\u00f3n**: 2025-11-30
