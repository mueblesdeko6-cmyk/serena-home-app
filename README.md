# Serena Home — Plataforma completa (catálogo + cotizaciones + panel de administración)

App real (Next.js + Supabase) preparada para desplegarse **100% gratis**, sin tarjeta de
crédito, con tu propio link (ej. `serena-home.vercel.app`) que abre directo en cualquier
navegador — sin necesidad de tener cuenta de Claude ni instalar nada.

Este proyecto es la versión "plataforma completa" pensada para cuando quieras dar el salto
más allá del catálogo interactivo. **No reemplaza** el catálogo que ya tienes funcionando en
Claude — es una base de código aparte, lista para crecer, con base de datos real, login y
panel de reportes.

Ya incluye tus **60 productos reales**, sus fotos, tu logo, y los 4 asesores (Lina, Yesica,
Jose, Leini) con sus números de WhatsApp reales — nada fue inventado, todo se tomó del
catálogo que ya tenías.

---

## 1. Qué incluye (y qué no) en esta primera versión

**Incluido:**
- Catálogo público (sin pantalla de bienvenida bloqueante), carrito, checkout con selección
  de asesor al final, cotización en imagen con tu logo y número de cotización
  `SH-YYYYMMDD-HHMM`, envío por WhatsApp.
- **Toda cotización generada se guarda automáticamente** en la base de datos (se envíe o no
  por WhatsApp), con cliente, asesor de origen, asesor seleccionado, productos, total y estado.
- Login de administración (Supabase Auth) con roles Admin / Vendedor.
- Panel de administración: cotizaciones de hoy y del mes, valor total, ventas confirmadas,
  ticket promedio, tabla completa con filtros (fecha, asesor, estado, búsqueda) y
  exportación a CSV (se abre en Excel).
- Carrito persistente (si cierran el navegador, sigue ahí al volver).

**Dejado como siguiente paso (marcado explícitamente, no simulado):**
- Edición de productos/precios sin tocar código (hoy se editan en
  `src/data/products.json`). Se puede agregar una tabla `products` editable desde el panel
  más adelante — el esquema (`supabase/schema.sql`) ya la tiene lista.
- Embudo de conversión completo (visitas → agregados al carrito → etc.) — requiere una tabla
  de eventos adicional; no se implementó para no inflar el alcance de esta primera versión.
- Subida de fotos desde el panel (hoy las fotos viven en `/public/images`).

---

## 2. Herramientas usadas (todas con capa gratuita, sin tarjeta)

| Parte | Herramienta | Plan gratis |
|---|---|---|
| Hosting de la web | [Vercel](https://vercel.com) | Sí, no pide tarjeta |
| Base de datos + login | [Supabase](https://supabase.com) | Sí, no pide tarjeta |
| Código fuente | [GitHub](https://github.com) | Sí, repos privados gratis |

> Si en algún paso de registro llegaran a pedirte datos de pago, detente y avísame —
> no es lo esperado en el plan gratuito de ninguna de las tres.

---

## 3. Paso a paso para publicar tu propio link gratis

### 3.1 Crear el proyecto en Supabase (base de datos + login)
1. Entra a [supabase.com](https://supabase.com) → **Start your project** → crea cuenta gratis
   **con el correo nuevo** (el plan gratis es por cuenta, así que un correo distinto al que
   ya usaste para la agenda de la clínica te da un cupo gratuito aparte).
2. **New project** → nombre `serena-home`, elige una contraseña de base de datos (guárdala) y
   una región cercana (ej. `South America (São Paulo)`).
3. Cuando el proyecto esté listo, ve a **SQL Editor** → **New query**.
4. Abre el archivo `supabase/schema.sql` de esta carpeta, copia todo su contenido, pégalo ahí
   y dale **Run**. Esto crea las tablas de productos, asesores, cotizaciones y perfiles, con
   tus 4 asesores reales ya cargados (Lina, Yesica, Jose, Leini).
5. Ve a **Project Settings → API**. Copia:
   - `Project URL` → lo vas a pegar en `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → lo vas a pegar en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.2 Subir el código a GitHub
1. Crea una cuenta en [github.com](https://github.com) con el mismo correo nuevo (si ya tienes
   una cuenta de GitHub de otro proyecto, esta parte sí la puedes compartir sin problema —
   GitHub no tiene el límite de "un proyecto gratis por cuenta" que sí tienen Supabase y Vercel).
2. Crea un repositorio nuevo (puede ser privado), por ejemplo `serena-home-app`.
3. Sube esta carpeta completa a ese repositorio (arrastrando los archivos desde la web de
   GitHub funciona si no usas la terminal, o pide ayuda a alguien que use `git`).

### 3.3 Desplegar en Vercel
1. Entra a [vercel.com](https://vercel.com) → **Sign up** (puedes entrar con tu cuenta de
   GitHub) → plan **Hobby** (gratis).
2. **Add New → Project** → elige el repositorio `serena-home-app`.
3. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = el Project URL que copiaste
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = el anon key que copiaste
   - `NEXT_PUBLIC_OWNER_WHATSAPP` = tu número (ej. `573142406671`)
4. **Deploy**. En 1-2 minutos te da un link como `serena-home-app.vercel.app` — ese es tu
   link público, funciona en cualquier navegador, sin login de Claude ni de nada.
5. (Opcional) En **Settings → Domains** puedes ponerle un nombre más corto dentro de lo que
   Vercel ofrece gratis, o conectar un dominio propio si algún día compras uno.

### 3.4 Crear tu usuario administrador
1. Entra a `tu-link.vercel.app/admin/login` → pestaña **Crear una cuenta nueva** → regístrate
   con tu correo real.
2. Vuelve a Supabase → **SQL Editor** → corre (con tu correo):
   ```sql
   update public.profiles set role = 'admin' where email = 'tu-correo@ejemplo.com';
   ```
3. Ahora entra de nuevo a `/admin/login` con ese correo → ya ves el panel completo en
   `/admin/dashboard`.

### 3.5 Crear una cuenta para cada asesora (Lina, Yesica, Jose, Leini)
No hay límite de cuentas — puedes crear una por cada asesora, todas caben en el plan gratis.
1. Cada asesora entra a `tu-link.vercel.app/admin/login` → **Crear una cuenta nueva** → se
   registra con su propio correo (o tú la creas por ella, con un correo/contraseña que le
   compartas).
2. Tú, desde Supabase → **SQL Editor**, conectas esa cuenta con su asesora real:
   ```sql
   update public.profiles set vendor_key = 'lina' where email = 'correo-de-lina@ejemplo.com';
   ```
   (cambia `'lina'` por `'yesica'`, `'jose'` o `'leini'` según corresponda).
3. Listo — esa cuenta ya entra a `/admin/cotizaciones` y ve **solo sus propias cotizaciones**,
   nunca las de las demás asesoras (esto lo garantiza la base de datos, no solo la pantalla).
   No ve el dashboard general — ese sigue siendo solo para ti como administradora.

---

## 4. Desarrollo local (opcional, si quieres probar antes de publicar)

```bash
npm install
cp .env.local.example .env.local   # y completa con tus datos de Supabase
npm run dev
```

Abre `http://localhost:3000`.

---

## 5. Dónde tocar qué

- **Productos, precios, colores, tallas:** `src/data/products.json`
- **Fotos de producto:** `public/images/<image_slug>.jpg` (el nombre de archivo de cada
  producto está en `image_slug` dentro de `products.json`)
- **Asesores y teléfonos:** `src/data/vendors.json` **y** la tabla `vendors` en Supabase
  (deben coincidir)
- **Logo:** `public/logo.png`
- **Colores/estilo:** `tailwind.config.ts`

Cualquier cambio en estos archivos se publica solo con volver a subir a GitHub — Vercel
redespliega automáticamente.
