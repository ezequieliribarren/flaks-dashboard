# Flaks — Tablero de Clientes

Webapp de gestión de clientes de la agencia Flaks. Next.js 15 + Supabase + Google OAuth.

---

## Cómo correr localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y completar variables de entorno
cp .env.example .env.local
# Editá .env.local con las keys de Supabase

# 3. Correr en modo desarrollo
npm run dev
# → http://localhost:3000
```

---

## Deploy a Vercel (primera vez)

### Paso 1 — Supabase

1. Entrá a [supabase.com](https://supabase.com) → **New project**
2. Anotá la **Project URL** y las **API Keys** (anon key + service role key)
3. En el **SQL Editor** del proyecto, pegá y ejecutá el contenido completo de `supabase/migrations/001_initial_schema.sql`
4. Verificá en **Table Editor** que se crearon las tablas: `clients`, `services`, `objectives`, `fixed_content`, `activity_log`, `team_members`

### Paso 2 — Google Cloud Console (OPCIONAL — solo si querés integración con Calendar)

> **Si no necesitás crear/borrar eventos en Calendar desde la app, saltá este paso completamente.** El login funciona con Magic Link (email), sin Google Cloud.


1. Entrá a [console.cloud.google.com](https://console.cloud.google.com)
2. Creá un proyecto nuevo (o usá uno existente)
3. Habilitá la **Google Calendar API**: Menú → APIs & Services → Enable APIs → buscá "Google Calendar API" → Enable
4. Configurá el **OAuth consent screen**: External → completá nombre de app, email de soporte → en "Scopes" agregá `calendar.events` → en "Test users" agregá los emails de Ezequiel y Germán
5. Creá credenciales: Credentials → Create Credentials → OAuth 2.0 Client ID → Web application
   - **Authorized redirect URIs**: `https://TU-PROYECTO.supabase.co/auth/v1/callback`
   - (La URL del proyecto Supabase la encontrás en Settings → API)
6. Guardá el **Client ID** y **Client Secret**

### Paso 3 — Configurar Google OAuth en Supabase (solo si hiciste el paso 2)

1. En Supabase → **Authentication** → **Providers** → **Google**
2. Pegá el Client ID y Client Secret
3. En **Authorized Client IDs** (si aparece), dejá el mismo Client ID
4. En **Authentication** → **URL Configuration**:
   - Site URL: `https://TU-APP.vercel.app`
   - Redirect URLs: `https://TU-APP.vercel.app/auth/callback`

### Paso 4 — Vercel

1. Subí el proyecto a GitHub (ver sección siguiente)
2. Entrá a [vercel.com](https://vercel.com) → **New Project** → importá el repo
3. En **Environment Variables** configurá:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
   SUPABASE_SERVICE_ROLE_KEY     = eyJ...
   ALLOWED_EMAILS                = info@flaks.com.ar,email-german@gmail.com
   EZE_EMAIL                     = info@flaks.com.ar
   GER_EMAIL                     = email-german@gmail.com
   ```
4. Deploy → una vez desplegado, copiá la URL de Vercel y actualizala en Supabase Auth URL Configuration

### Paso 5 — Migración de datos

Con el `.env.local` completo:

```bash
npm run migrate
```

Verificá en Supabase Table Editor que los datos están correctos.

---

## Subir a GitHub

```bash
git init
git add .
git commit -m "Initial webapp Flaks"
git remote add origin https://github.com/TU-USUARIO/flaks-dashboard
git push -u origin main
```

---

## Cómo agregar un nuevo miembro al equipo

1. Agregar su email a `ALLOWED_EMAILS` en Vercel (Settings → Environment Variables)
2. Agregar el mapeo en `EZE_EMAIL` / `GER_EMAIL` (actualmente solo hay 2 roles)
3. Si es un tercer rol, contactar al desarrollador para agregar la lógica de role_code

---

## Cómo dar permisos de Calendar

Los calendarios de EZE y GER son calendarios de Google (no el personal de cada uno, sino los configurados en `team_members.calendar_id`). Para que los eventos se puedan crear:

- El usuario logueado necesita tener permiso de **escritura** en el calendario del responsable
- Si Ezequiel se loguea y agenda un evento para Germán, Ezequiel necesita permisos de escritura en el calendario de Germán
- Configurar permisos: Google Calendar → el calendario de destino → Compartir con esta persona → acceso "Hacer cambios en eventos"

---

## Limitaciones conocidas

- **Tokens de Google**: Los access tokens de Google duran ~1 hora. Si el token expira, el endpoint de Calendar devuelve un error claro. Solución: hacer Sign Out y volver a loguearse.
- **AMBOS**: Cuando el responsable es "AMBOS", el evento se crea en el calendario configurado como `calendarId` de AMBOS en `team_members` (actualmente `info@flaks.com.ar`).
- **Refresh automático**: Los datos se refrescan automáticamente cada 60 segundos. Si Ezequiel hace un cambio, Germán lo ve en ~60 segundos sin recargar.
- **Un solo login a la vez por rol**: La tabla `team_members` vincula cada `role_code` a un único `user_id`. Si una misma persona usa dos cuentas de Google distintas, solo la primera que se logueó queda vinculada al rol.
