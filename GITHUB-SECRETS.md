# GitHub Secrets Configuration

## 📋 Secretos Requeridos para GitHub Actions

Para que el workflow de Docker build funcione correctamente, necesitas configurar estos secretos en tu repositorio de GitHub.

### 🔐 Cómo Agregar Secretos

1. Ve a tu repositorio en GitHub: `https://github.com/hectorcanaimero/menu-maestro-saas`
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Agrega cada secreto con su nombre y valor exactos

---

## ✅ Lista de Secretos a Configurar

### Supabase Configuration

```
Name: VITE_SUPABASE_PROJECT_ID
Value: wdpexjymbiyjqwdttqhz
```

```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcGV4anltYml5anF3ZHR0cWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzc3MzksImV4cCI6MjA3OTMxMzczOX0.eIeDRNLcdTKx8QidcrKSKJRqG1NtkLDKNXZFX_tGjv4
```

```
Name: VITE_SUPABASE_URL
Value: https://wdpexjymbiyjqwdttqhz.supabase.co
```

### PostHog Analytics

```
Name: VITE_POSTHOG_KEY
Value: phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH
```

```
Name: VITE_POSTHOG_HOST
Value: https://us.i.posthog.com
```

```
Name: VITE_POSTHOG_PERSONAL_KEY
Value: phx_eeQqcG3kkkpOzDLOK5cSpUkPJiIhLtQ6v33055zLoH73SEU
```

```
Name: VITE_POSTHOG_API_KEY
Value: phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH
```

### Google Maps (Opcional)

```
Name: VITE_GOOGLE_MAPS
Value: (dejar vacío si no tienes API key)
```

---

## 🚀 Verificar Configuración

### Opción 1: Via GitHub CLI

Si tienes `gh` instalado, puedes verificar que los secretos estén configurados:

```bash
gh secret list
```

### Opción 2: Trigger Manual Build

1. Ve a **Actions** en tu repositorio
2. Selecciona el workflow **Docker Build & Publish**
3. Click en **Run workflow**
4. Selecciona la rama `main`
5. Click en **Run workflow**

Si el build es exitoso, todos los secretos están correctamente configurados ✅

---

## ⚠️ Secretos Faltantes Actualmente

Basado en el workflow actualizado, necesitas agregar:

- ✅ `VITE_SUPABASE_PROJECT_ID` (probablemente ya configurado)
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` (probablemente ya configurado)
- ✅ `VITE_SUPABASE_URL` (probablemente ya configurado)
- ✅ `VITE_POSTHOG_KEY` (probablemente ya configurado)
- ✅ `VITE_POSTHOG_HOST` (probablemente ya configurado)
- ✅ `VITE_POSTHOG_PERSONAL_KEY` (probablemente ya configurado)
- ❌ `VITE_POSTHOG_API_KEY` **(NUEVO - necesitas agregarlo)**
- ❓ `VITE_GOOGLE_MAPS` (opcional - agrégalo si planeas usar Google Maps)

---

## 🔄 Workflow Triggers

El workflow se ejecuta automáticamente cuando:

1. **Push de un tag con versión**: `v3.0.12`, `v3.1.0`, etc.
   ```bash
   git tag -a v3.0.12 -m "Release v3.0.12"
   git push origin v3.0.12
   ```

2. **Publicación de un Release** en GitHub

3. **Manualmente** desde la UI de GitHub Actions

---

## 📦 Qué Hace el Workflow

1. Hace checkout del código
2. Configura Docker Buildx
3. Se autentica en GitHub Container Registry
4. Construye la imagen Docker con **todas** las variables de entorno como build args
5. Publica la imagen a `ghcr.io/hectorcanaimero/menu-maestro-saas`
6. Crea tags múltiples: `latest`, `v3.0.x`, `v3.0`, `v3`, `sha-xxxxx`
7. Notifica a n8n via webhook para deployment automático

---

## 🔍 Troubleshooting

### Error: "secret not found"

**Causa**: El secreto no está configurado en GitHub.

**Solución**: Agrega el secreto faltante siguiendo los pasos de arriba.

### Build exitoso pero PostHog no funciona

**Causa**: El secreto `VITE_POSTHOG_API_KEY` probablemente está vacío o tiene un valor incorrecto.

**Solución**:
1. Verifica que el valor sea exactamente: `phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH`
2. Re-trigger el workflow manualmente
3. Verifica en los logs del build que el valor se pasó correctamente

### Workflow no se ejecuta automáticamente

**Causa**: El push del tag no disparó el workflow.

**Solución**:
```bash
# Verifica que el tag exista
git tag -l

# Asegúrate de hacer push del tag
git push origin v3.0.12

# O push de todos los tags
git push --tags
```

---

## 📚 Referencias

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
