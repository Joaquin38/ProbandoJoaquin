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

### Estado actual de implementación

- ✅ `GET /categorias?hogar_id=1`
- ✅ `POST /categorias`
- ✅ `GET /etiquetas?hogar_id=1`
- ✅ `POST /etiquetas`

## Movimientos

- `GET /movimientos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
- `POST /movimientos`
- `PATCH /movimientos/:id`
- `DELETE /movimientos/:id`

### Estado actual de implementación

- ✅ `GET /movimientos?hogar_id=1[&desde=YYYY-MM-DD&hasta=YYYY-MM-DD]`
- ✅ `POST /movimientos`
- ✅ `PATCH /movimientos/:id` (actualiza descripción/categoría/cuenta)
- ✅ `DELETE /movimientos/:id`

## Gastos fijos

- `GET /gastos-fijos`
- `POST /gastos-fijos`
- `POST /gastos-fijos/:id/ajustes`

### Estado actual de implementación

- ✅ `GET /gastos-fijos?hogar_id=1`
- ✅ `POST /gastos-fijos`
- ✅ `POST /gastos-fijos/:id/ajustes`

## Cotizaciones e IPC

- `GET /cotizaciones?fecha=YYYY-MM-DD`
- `POST /cotizaciones/sincronizar` (astropay/mep)
- `GET /ipc?periodo=YYYY-MM`
- `POST /ipc/sincronizar`

### Estado actual de implementación

- ✅ `GET /cotizaciones`
- ✅ `GET /cotizaciones?fecha=YYYY-MM-DD`

## Dashboard

- `GET /dashboard/mes-actual`
- `GET /dashboard/ultimo-mes-cerrado`

### Estado actual de implementación

- ✅ `GET /dashboard/resumen?hogar_id=1`
