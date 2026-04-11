# Conexión a PostgreSQL desde DBeaver

## Datos de conexión (desarrollo local)

- Host: `localhost`
- Puerto: `5432` (o el valor de `POSTGRES_PORT` en `.env`)
- Base de datos: `finanzas_db`
- Usuario: `finanzas`
- Contraseña: `finanzas_dev`

> Si cambiaste los valores del `.env`, usá esos mismos en DBeaver.

## Pasos en DBeaver

1. **Database > New Database Connection**.
2. Elegí **PostgreSQL**.
3. Completá host, puerto, base, usuario y contraseña.
4. Click en **Test Connection**.
5. Guardá la conexión.

## Problemas comunes

- **Connection refused**: verificar que el contenedor esté arriba (`docker compose ps`).
- **Password authentication failed**: revisar usuario/clave en `.env`.
- **No se crean tablas**: si el volumen ya existía, el script de init no corre de nuevo. En ese caso ejecutar el SQL manualmente o resetear la BD.
