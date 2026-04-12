# App de Finanzas Personales (ARS/USD)

Base inicial del proyecto para gestionar finanzas personales por mes, con foco en pesos, soporte de ingresos en dólares, gastos fijos, consumos, ahorro y cotización diaria.

## Stack objetivo

- Backend: NestJS + TypeScript + Prisma (pendiente en próximos pasos)
- Frontend: Next.js + React + Tailwind (pendiente en próximos pasos)
- Base de datos: PostgreSQL
- Infra local: Docker Compose

## Si no sabés si clonar o hacer pull

### Caso A: **No tenés el repo en tu PC**

1. Abrí terminal (PowerShell, CMD o Git Bash).
2. Cloná el repositorio:

```bash
git clone <URL_DE_TU_REPO>
cd ProbandoJoaquin/finanzas-app
```

### Caso B: **Ya tenés el repo en tu PC**

```bash
cd <carpeta-donde-tenes-el-repo>/ProbandoJoaquin
git pull
cd finanzas-app
```

---

## Levantar el entorno local (paso a paso)

### 1) Preparar variables de entorno

```bash
cp .env.example .env
```

> En Windows PowerShell, si `cp` no funciona: `Copy-Item .env.example .env`

### 2) Levantar PostgreSQL

Opción recomendada (automática):

```bash
./scripts/iniciar_entorno.sh
```

Si estás en **PowerShell (Windows)** usá:

```powershell
.\scripts\iniciar_entorno.ps1
```

Opción manual:

```bash
docker compose up -d
```

### 3) Verificar estado si algo falla

```bash
./scripts/estado_entorno.sh
```

PowerShell:

```powershell
.\scripts\estado_entorno.ps1
```

### 4) Reiniciar base desde cero (si querés empezar limpio)

```bash
./scripts/reset_bd.sh
```

PowerShell:

```powershell
.\scripts\reset_bd.ps1
```

---

## Conectar DBeaver

Usá estos datos:

- `Host`: `localhost`
- `Puerto`: `5432`
- `Base`: `finanzas_db`
- `Usuario`: `finanzas`
- `Contraseña`: `finanzas_dev`

Guía completa: `docs/conexion_dbeaver.md`.

---

## Backend inicial

Se agregó un backend inicial en `backend/` con conexión a PostgreSQL y endpoints de movimientos.

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Probar endpoint de salud:

```bash
curl http://localhost:3000/salud
```

Listar movimientos demo:

```bash
curl "http://localhost:3000/movimientos?hogar_id=1"
```

Actualizar un movimiento:

```bash
curl -X PATCH http://localhost:3000/movimientos/1 \
  -H "Content-Type: application/json" \
  -d '{ "descripcion": "Compra supermercado mensual" }'
```

Eliminar un movimiento:

```bash
curl -X DELETE http://localhost:3000/movimientos/1
```

Listar categorías del hogar:

```bash
curl "http://localhost:3000/categorias?hogar_id=1"
```

Crear etiqueta:

```bash
curl -X POST http://localhost:3000/etiquetas \
  -H "Content-Type: application/json" \
  -d '{ "hogar_id": 1, "nombre": "tarjeta" }'
```

## Frontend inicial (React + Vite)

Se agregó un frontend base en `frontend/` con:

- resumen de ingresos/egresos/balance,
- alta de movimientos vía modal popup,
- edición y eliminación de movimientos desde la tabla,
- botones de acción con íconos (✏️ editar / 🗑️ eliminar),
- tabla de movimientos,
- menú lateral colapsable fijo a la izquierda,
- visualización del ciclo actual (ej: abril 2026),
- panel de cotización del dólar,
- sección de gastos fijos (alta + listado),
- confirmación de eliminación en popup propio,
- filtro para ver/ocultar movimientos eliminados,
- conexión a API vía `VITE_API_URL`.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abrí `http://localhost:5173`.

## ¿Tengo que correr siempre `npm install` y `npm run dev`?

Regla práctica:

- `npm install`: **solo la primera vez** (o cuando cambie `package.json`).
- `npm run dev`: **sí, cada vez que quieras levantar** backend/frontend en modo desarrollo.

Flujo diario típico:

1. Levantar DB (`docker compose up -d` o script `iniciar_entorno`).
2. Terminal 1 (`backend/`): `npm run dev`.
3. Terminal 2 (`frontend/`): `npm run dev`.

Si bajaste cambios nuevos del repo y cambió `package.json`, corré otra vez `npm install`.

### Error común en frontend: "Failed to fetch"

Suele pasar cuando backend no está levantado o falta reinstalar dependencias tras cambios.

Checklist:

1. En `backend/`: `npm install` (importante si cambió `package.json`) y `npm run dev`.
2. Probar salud backend: `curl http://localhost:3000/salud`.
3. En `frontend/.env` verificar `VITE_API_URL=http://localhost:3000`.
4. Reiniciar `npm run dev` de frontend.

### Flujo para levantar el proyecto cada vez (mientras seguimos metiendo cambios)

1. `git pull` en tu rama local.
2. `docker compose up -d` (o `./scripts/iniciar_entorno.ps1`).
3. Backend (`finanzas-app/backend`):
   - `npm install` solo si cambió `package.json`
   - `npm run dev`
4. Frontend (`finanzas-app/frontend`):
   - `npm install` solo si cambió `package.json`
   - `npm run dev`
5. Abrir `http://localhost:5173`.

Crear un movimiento demo:

```bash
curl -X POST http://localhost:3000/movimientos \
  -H "Content-Type: application/json" \
  -d '{
    "hogar_id": 1,
    "cuenta_id": 1,
    "tipo_movimiento_id": 2,
    "categoria_id": 2,
    "fecha": "2026-04-12",
    "descripcion": "Compra supermercado",
    "moneda_original": "ARS",
    "monto_original": 55000,
    "monto_ars": 55000,
    "creado_por_usuario_id": 1
  }'
```

## Datos demo opcionales

Para cargar un hogar/usuario/categorías demo y probar la API rápido:

```bash
docker compose exec -T postgres psql -U finanzas -d finanzas_db < bd/02_datos_demo.sql
```

Si ya tenías una base creada de antes, aplicá también la migración de baja lógica en movimientos:

```bash
docker compose exec -T postgres psql -U finanzas -d finanzas_db < bd/03_movimientos_soft_delete.sql
```

---

## Qué incluye hoy este repo

- Infra local de PostgreSQL lista para iniciar.
- Esquema SQL inicial en español.
- Documentación del modelo de datos y endpoints v1.
- Scripts de operación local (`iniciar_entorno`, `estado_entorno`, `reset_bd`).

## Próximos pasos sugeridos

1. Inicializar backend NestJS real en `backend/`.
2. Traducir esquema SQL a Prisma schema.
3. Implementar autenticación + hogares compartidos.
4. Exponer endpoints de movimientos, categorías, etiquetas y cotizaciones.

## Resolver conflictos al abrir PR

Si GitHub te marca conflictos en `.env.example`, `README.md` o docs, hacé esto en tu rama:

```bash
git fetch origin
git checkout <tu-rama>
git merge origin/main
```

Después resolvé conflictos en los archivos marcados, guardá, y ejecutá:

```bash
git add finanzas-app/.env.example finanzas-app/README.md finanzas-app/docs/conexion_dbeaver.md
git commit -m "Resuelve conflictos con main"
git push
```

Cuando subas ese push, el PR debería quedar sin conflictos.

Guía extendida: `docs/resolver_conflictos_pr.md`.

## ¿Dónde quedan los cambios y cómo traerlos a tu repo local?

Todos los cambios de código/documentación que hago quedan en el repositorio remoto (rama de trabajo + PR).
En tu PC local siempre hacé este flujo para traer lo último:

```bash
cd <tu-repo>/ProbandoJoaquin
git fetch --all
git checkout <rama-que-estas-usando>
git pull
```

Si querés incorporar lo de una rama remota nueva:

```bash
git checkout -b mi-rama-local origin/<rama-remota>
```

Después de trabajar localmente, para subir tus cambios:

```bash
git add .
git commit -m "mensaje"
git push
```
