# Dockerización de AgendaSaaS (Next.js 16 + Prisma + PostgreSQL)

Guía para levantar la aplicación completa con **Docker Compose v2**: PostgreSQL 17, el servidor Next.js compilado en modo producción y la carga de datos demo. Complementa a `README.md`, que cubre el desarrollo local sin contenedores.

Todos los comandos se ejecutan desde la raíz del proyecto:

```powershell
cd "C:\Users\Wiliamm\Desktop\startup pro\proyecto-agenda"
```

---

## 1. Requisitos

- **Docker Desktop** (Windows o macOS) o **Docker Engine** con el plugin de Compose en Linux.
- **Docker Compose v2** obligatorio: el comando es `docker compose`, con espacio. Verifica con:

  ```bash
  docker compose version
  ```

  Si falla, actualiza Docker Desktop o instala el paquete `docker-compose-plugin`.
- **Puerto 3000 libre** en tu máquina (o el que decidas publicar; ver sección 4).
- **~3 GB de espacio libre**: se construyen dos imágenes (una de build completa para `migrate` y una mínima para `app`) y se guarda el volumen `dbdata`.
- No necesitas Node.js instalado: la compilación ocurre dentro de la imagen.

---

## 2. Puesta en marcha paso a paso

### Qué hay en `docker-compose.yml`

| Servicio  | Origen                                                       | Función                                                                                                   |
| --------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `db`      | `postgres:17-alpine`                                         | Base de datos con volumen `dbdata`, `healthcheck` con `pg_isready` y `docker/postgres-init.sql` montado.    |
| `app`     | Build local (`Dockerfile`, multi-stage, salida standalone)   | Next.js en el puerto 3000, usuario no root `nextjs`, arranca cuando `db` está `healthy`.                    |
| `migrate` | Build local, etapa `builder`, perfil `setup`                 | Ejecución única: `npx prisma db push` y, si `SEED_DEMO=1`, el seed demo. Termina y se retira.               |

`migrate` está bajo el perfil `setup`, así que **no se ejecuta** en un `docker compose up` normal: hay que pedirlo explícitamente con `--profile setup`.

> La imagen de `migrate` reutiliza la etapa `builder` del `Dockerfile` (la que tiene `prisma`, `tsx` y el esquema). Si renombras esa etapa, define `MIGRATE_BUILD_TARGET` con el nombre nuevo.

### Paso 1 — Crear el archivo de variables

```powershell
Copy-Item .env.docker.example .env.docker
```

En bash/macOS/Linux: `cp .env.docker.example .env.docker`.

Este archivo se pasa a Compose con `--env-file .env.docker`. Revisa al menos:

```env
# Se usa para firmar los JWT de sesión. Cambia el valor por defecto.
JWT_SECRET="<cadena aleatoria larga>"

# 1 = cargar datos demo en el paso 3; 0 = solo crear el esquema.
SEED_DEMO=1
```

Notas:

- Si no pasas `--env-file`, Compose lee el `.env` del proyecto (el de desarrollo) y aplica los valores por defecto del propio `docker-compose.yml`.
- La `DATABASE_URL` que aparece en `.env.docker.example` es informativa: dentro de Docker, Compose fija `postgresql://postgres:postgres@db:5432/proyecto_agenda?schema=public`. El host **es `db`**, nunca `127.0.0.1`, porque dentro del contenedor `127.0.0.1` es el propio contenedor.
- El mapeo de puertos de `db` está comentado a propósito: la base no se publica y la app la alcanza por la red interna de Compose.

### Paso 2 — Crear el esquema (y datos demo) con `migrate`

```bash
docker compose --env-file .env.docker --profile setup run --rm migrate
```

- `run --rm` ejecuta el servicio una vez y borra el contenedor al terminar.
- Con `SEED_DEMO=1` ejecuta también `npx tsx prisma/seed-test.ts`.
- La primera vez compila la imagen `builder` (incluye `next build`), así que puede tardar varios minutos.
- Compose arranca `db` por su cuenta y espera a que el `healthcheck` la marque como `healthy`, porque `migrate` depende de ella.

Si `SEED_DEMO=0` (valor por defecto), verás `Seed omitido`. Puedes cargar los datos después sin tocar el archivo:

```bash
docker compose --env-file .env.docker --profile setup run --rm -e SEED_DEMO=1 migrate
```

O lanzar solo el seed (el comando indicado sustituye al del servicio, y el esquema debe existir ya):

```bash
docker compose --env-file .env.docker --profile setup run --rm migrate npx tsx prisma/seed-test.ts
```

El seed crea 2 negocios, 8 usuarios, servicios, horarios y citas de ejemplo. Todas las cuentas demo usan la contraseña `password123`.

### Paso 3 — Construir y arrancar la aplicación

```bash
docker compose --env-file .env.docker up -d --build
```

- `--build` fuerza la reconstrucción de la imagen `app` (necesario la primera vez y tras cambiar dependencias).
- `-d` deja los servicios en segundo plano.

Comprueba el estado hasta ver `db` como `(healthy)` y `app` como `Up`:

```bash
docker compose ps
```

### Paso 4 — Abrir la aplicación

Abre <http://localhost:3000>.

| Ruta                  | Descripción                                      |
| --------------------- | ------------------------------------------------ |
| `/`                   | Portada de la plataforma.                        |
| `/login`              | Inicio de sesión.                                |
| `/b/barberia-vintage` | Portal público de reservas del negocio demo.     |
| `/admin`              | Panel del negocio (dueño, gerente y personal).   |
| `/superadmin`         | Panel de plataforma (requiere rol `SUPERADMIN`). |

Cuentas demo (contraseña `password123`):

| Correo                        | Rol   | Panel    |
| ----------------------------- | ----- | -------- |
| `admin@barberiavintage.com`   | OWNER | `/admin` |
| `gerente@barberiavintage.com` | ADMIN | `/admin` |
| `mateo@barberiavintage.com`   | STAFF | `/admin` |

El panel `/superadmin` necesita el usuario de plataforma, que crea un seed aparte (usa `upsert`, es idempotente):

```bash
docker compose --env-file .env.docker --profile setup run --rm migrate npx tsx prisma/seed-superadmin.ts
```

Credenciales: `superadmin@agenda.com` / `SuperAdmin123` (solo para pruebas).

### Paso 5 — Detener

```bash
docker compose down       # detiene y elimina contenedores; conserva el volumen dbdata
docker compose down -v    # además borra la base de datos (irreversible)
```

---

## 3. Comandos útiles

| Acción                                    | Comando                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| Ver estado y salud de los servicios       | `docker compose ps`                                                              |
| Seguir logs de la app                     | `docker compose logs -f app`                                                     |
| Seguir logs de la base                    | `docker compose logs -f db`                                                      |
| Últimas 100 líneas de logs de todo        | `docker compose logs --tail=100`                                                 |
| Entrar al contenedor de la app            | `docker compose exec app sh`                                                     |
| Abrir `psql` en la base                   | `docker compose exec db psql -U postgres -d proyecto_agenda`                     |
| Comprobar que Postgres acepta conexiones  | `docker compose exec db pg_isready -U postgres -d proyecto_agenda`               |
| Aplicar el esquema (`db push`)            | `docker compose --profile setup run --rm migrate`                                |
| Cargar los datos demo                     | `docker compose --profile setup run --rm -e SEED_DEMO=1 migrate`                 |
| Ejecutar solo el seed                     | `docker compose --profile setup run --rm migrate npx tsx prisma/seed-test.ts`    |
| Reiniciar la app                          | `docker compose restart app`                                                     |
| Recrear la app tras cambiar variables     | `docker compose --env-file .env.docker up -d --force-recreate app`               |
| Reconstruir la imagen sin caché           | `docker compose build --no-cache app`                                            |
| Reconstruir y arrancar                    | `docker compose up -d --build`                                                   |
| Validar la sintaxis del compose           | `docker compose config -q`                                                       |

Para `ps`, `logs`, `exec`, `restart` y `down` no hace falta `--env-file`: no dependen de las variables de `.env.docker`. Para `up`, `run` y `config`, añádelo si quieres que tomen tus valores.

> `docker compose restart` **no** recarga variables de entorno: reinicia el proceso con las que ya tenía el contenedor. Tras editar `.env.docker` usa `docker compose --env-file .env.docker up -d --force-recreate app`.

> El seed de `prisma/seed-test.ts` empieza con `deleteMany()` de todas las tablas: **borra y recrea** el contenido. No lo ejecutes sobre datos que quieras conservar.

> `docker/postgres-init.sql` se ejecuta solo cuando el volumen `dbdata` está vacío (primera inicialización). Si lo modificas después, los cambios no se aplican solos: `docker compose down -v` y volver a empezar, o ejecutar el SQL a mano.

---

## 4. Cambiar el puerto y usar una base externa

### 4.1 Cambiar el puerto publicado

Edita `docker-compose.yml` y cambia solo el lado izquierdo del mapeo (el de tu máquina), por ejemplo al 8080:

```yaml
services:
  app:
    ports:
      - "8080:3000"
```

Luego recrea el contenedor:

```bash
docker compose up -d app
```

La app queda en <http://localhost:8080>. El puerto interno sigue siendo 3000 (`PORT=3000`, `HOSTNAME=0.0.0.0` en el `Dockerfile`): cambia solo el lado izquierdo del mapeo; si tocas el derecho, el `EXPOSE`, el `CMD` y las comprobaciones de estado dejarán de cuadrar.

### 4.2 Apuntar a una base de datos externa

No hace falta tocar el `Dockerfile` ni reconstruir: **solo cambia el valor de `DATABASE_URL`**. En este compose está fijado en el bloque `environment` de `app` y de `migrate`, así que sustituye el valor en ambos servicios:

```yaml
services:
  app:
    environment:
      DATABASE_URL: "postgresql://usuario:clave@db.mi-dominio.com:5432/mi_base?schema=public"
  migrate:
    environment:
      DATABASE_URL: "postgresql://usuario:clave@db.mi-dominio.com:5432/mi_base?schema=public"
```

Consideraciones:

- Si el proveedor exige TLS, añade `&sslmode=require` (o el parámetro que indique su documentación).
- Si la base corre en **tu propia máquina** y quieres llegar desde el contenedor, `127.0.0.1` no sirve: usa `host.docker.internal` en Docker Desktop, o el nombre/IP del host en Docker Engine.
- Aplica el esquema a esa base y recrea la app:

  ```bash
  docker compose --profile setup run --rm --no-deps migrate
  docker compose up -d --no-deps app
  ```

  `--no-deps` evita arrancar (o esperar) al Postgres local, que ya no usarías.

- La `DATABASE_URL` de `.env.docker.example` es solo una referencia para herramientas externas (Prisma Studio, DBeaver, `psql`): si descomentas el mapeo `"5433:5432"` del servicio `db`, desde tu máquina se llega con `postgresql://postgres:postgres@127.0.0.1:5433/proyecto_agenda?schema=public`.

---

## 5. Solución de problemas

| Síntoma | Causa | Solución |
| ------- | ----- | -------- |
| `Bind for 0.0.0.0:3000 failed: port is already allocated` | Otro contenedor o proceso ocupa el puerto 3000. | Publica otro puerto (`"8080:3000"` en `app`) o libera el 3000: `netstat -ano \| findstr :3000` en Windows (`lsof -i :3000` en Linux/macOS) y cierra el proceso con `taskkill /PID <pid> /F`. Después, `docker compose up -d app`. |
| La app responde 500 y en los logs aparece `P1001: Can't reach database server` o `ECONNREFUSED` | Postgres aún no acepta conexiones (primer arranque o reinicio), o cambiaste la URL y pusiste `127.0.0.1` en vez de `db`. | Espera a `db (healthy)` en `docker compose ps`, revisa `docker compose logs db` y deja el host `db:5432`. Si la contraseña no coincide con la del volumen ya inicializado (`P1000 authentication failed`), recrea con `docker compose down -v`. |
| `@prisma/client did not initialize yet` o `Cannot find module '.prisma/client/default'` | La imagen se construyó sin generar el cliente, o quedó una capa antigua en caché. | Reconstruye sin caché (`docker compose build --no-cache app`) y vuelve a levantar. El `Dockerfile` ya añade `openssl` y la etapa `builder` ejecuta `npx prisma generate` antes de `next build`. |
| `The table public.User does not exist`, error `P2021` o fallos al consultar cualquier modelo | El esquema nunca se aplicó a este volumen (base recién creada o `migrate` no se ejecutó). | Ejecuta `docker compose --profile setup run --rm migrate`. El proyecto no usa migraciones versionadas: el esquema se sincroniza con `prisma db push`. |
| El seed no se carga (`Seed omitido`), el login falla tras cambiar `JWT_SECRET`, o `Environment variable not found: DATABASE_URL` al usar Prisma a mano | `SEED_DEMO` vale `0` por defecto, `.env.docker` no se pasó con `--env-file` (Compose usa el `.env` de desarrollo) o faltan variables al ejecutar Prisma fuera de Compose. | Pon `SEED_DEMO=1` y un `JWT_SECRET` propio en `.env.docker` y ejecuta `migrate`/`up` con `--env-file .env.docker` (o `-e SEED_DEMO=1`). Para comandos sueltos, exporta `DATABASE_URL` en la misma línea. Al rotar `JWT_SECRET` se invalidan las sesiones abiertas. |
| `EACCES: permission denied` o `could not change permissions of directory "/var/lib/postgresql/data"` y `db` reiniciándose en bucle | El volumen `dbdata` quedó con propietario o formato distinto (creado por `root`/`sudo`, bind-mount de Windows o de otra versión de Postgres). | Lo más rápido: `docker compose down -v` y volver a levantar (borra los datos). Si necesitas conservarlos: `docker compose exec -u root db chown -R postgres:postgres /var/lib/postgresql/data` y luego `docker compose restart db`. |

---

## 6. Advertencias de seguridad

- **No commitees `.env.docker`.** La regla `.env*` del `.gitignore` ya lo excluye. Esa misma regla excluye también `.env.docker.example`: si quieres versionar la plantilla, añade `!.env.docker.example` al `.gitignore`.
- **Cambia `JWT_SECRET` en producción.** El valor por defecto del compose es el de desarrollo (`agenda_saas_dev_secret_2026_cambiar_en_produccion`). Define uno aleatorio y distinto por entorno en `.env.docker`, por ejemplo con `docker compose exec app node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` o, en bash, `openssl rand -base64 32`. Al rotarlo, todas las sesiones emitidas dejan de ser válidas y los usuarios deberán entrar de nuevo.
- **`password123` y `SuperAdmin123` son credenciales demo.** No deben existir en producción: no ejecutes los seeds (`seed-test.ts`, `seed-superadmin.ts`) contra una base real y crea usuarios con contraseñas propias.
- **No publiques el puerto de `db`.** El compose lo deja sin mapear a propósito. Si descomentas `"5433:5432"` para depurar, vuelve a comentarlo antes de desplegar: la app debe hablar con la base por la red interna.
- **Trata `WA_TOKEN` y `WA_VERIFY_TOKEN` como secretos** (tokens de Meta): no los pegues en issues, capturas ni logs, y no los incluyas en imágenes.
- **El contenedor `app` corre como usuario no root** (`nextjs`, uid 1001). No añadas `user: root` en Compose para "arreglar" permisos: corrige el archivo o el volumen implicado.

---

## 7. Qué NO incluye esta configuración

- **TLS/HTTPS:** no hay proxy inverso ni certificados; expón la app detrás de Nginx, Caddy, Traefik o el balanceador de tu proveedor.
- **Backups:** no hay `pg_dump` programado ni retención; define tu propia política para el volumen `dbdata`.
- **Réplicas y alta disponibilidad:** un solo Postgres y una sola instancia de `app`, sin failover, réplicas de lectura ni clúster.
- **Observabilidad:** sin métricas, trazas, logs centralizados ni alertas; para diagnosticar solo cuentas con `docker compose logs` y `docker compose ps`.
