# API v1 (borrador)

## Autenticación y hogar

- `POST /auth/registro`
- `POST /auth/login`
- `POST /hogares`
- `POST /hogares/:id/invitaciones`

## Catálogos

- `GET /tipos-movimiento`
- `GET /categorias`
- `POST /categorias`
- `GET /etiquetas`
- `POST /etiquetas`

## Movimientos

- `GET /movimientos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
- `POST /movimientos`
- `PATCH /movimientos/:id`
- `DELETE /movimientos/:id`

## Gastos fijos

- `GET /gastos-fijos`
- `POST /gastos-fijos`
- `POST /gastos-fijos/:id/ajustes`

## Cotizaciones e IPC

- `GET /cotizaciones?fecha=YYYY-MM-DD`
- `POST /cotizaciones/sincronizar` (astropay/mep)
- `GET /ipc?periodo=YYYY-MM`
- `POST /ipc/sincronizar`

## Dashboard

- `GET /dashboard/mes-actual`
- `GET /dashboard/ultimo-mes-cerrado`
