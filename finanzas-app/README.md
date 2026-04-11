# App de Finanzas Personales (ARS/USD)

Base inicial del proyecto para gestionar finanzas personales por mes, con foco en pesos, soporte de ingresos en dólares, gastos fijos, consumos, ahorro y cotización diaria.

## Stack objetivo

- Backend: NestJS + TypeScript + Prisma
- Frontend: Next.js + React + Tailwind
- Base de datos: PostgreSQL
- Infra local: Docker Compose

## Alcance de esta base

- Infra local de PostgreSQL lista para iniciar.
- Esquema SQL inicial en español.
- Documentación del modelo de datos y endpoints v1.

## Levantar base de datos local

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Iniciar PostgreSQL:

```bash
docker compose up -d
```

> El esquema `bd/01_esquema_inicial.sql` se aplica automáticamente en el primer arranque del contenedor.

3. Aplicar esquema inicial:

```bash
docker compose exec -T postgres psql -U finanzas -d finanzas_db < bd/01_esquema_inicial.sql
```

Este paso solo hace falta si querés reaplicar el esquema manualmente.

## Conectar DBeaver

Podés usar esta guía rápida con los datos de conexión locales:

- `Host`: `localhost`
- `Puerto`: `5432`
- `Base`: `finanzas_db`
- `Usuario`: `finanzas`
- `Contraseña`: `finanzas_dev`

Detalle completo: `docs/conexion_dbeaver.md`.

## Reiniciar base desde cero

Si necesitás borrar todo y volver a crear la base limpia:

```bash
./scripts/reset_bd.sh
```

## Backend inicial

Se agregó un backend mínimo en `backend/` para verificar entorno:

```bash
cd backend
npm install
npm run dev
```

Endpoint de salud:

```bash
curl http://localhost:3000/salud
```

## Próximos pasos sugeridos

1. Inicializar backend NestJS en `backend/`.
2. Traducir esquema SQL a Prisma schema.
3. Implementar autenticación + hogares compartidos.
4. Exponer endpoints de movimientos, categorías, etiquetas y cotizaciones.
