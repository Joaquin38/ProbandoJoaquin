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

Se agregó un backend mínimo en `backend/` para verificar que podés ejecutar servicios localmente.

```bash
cd backend
npm install
npm run dev
```

Probar endpoint de salud:

```bash
curl http://localhost:3000/salud
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
