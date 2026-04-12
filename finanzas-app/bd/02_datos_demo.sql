BEGIN;

INSERT INTO hogares (id, nombre)
VALUES (1, 'Hogar Demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, correo, clave_hash, nombre)
VALUES (1, 'demo@finanzas.local', 'demo_hash', 'Usuario Demo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hogares_usuarios (hogar_id, usuario_id, rol)
VALUES (1, 1, 'admin')
ON CONFLICT (hogar_id, usuario_id) DO NOTHING;

INSERT INTO cuentas (id, hogar_id, nombre, tipo, moneda_base)
VALUES
  (1, 1, 'Efectivo', 'caja', 'ARS'),
  (2, 1, 'Cuenta USD', 'banco', 'USD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categorias (id, hogar_id, nombre, tipo_movimiento_id)
VALUES
  (1, 1, 'Sueldo', 1),
  (2, 1, 'Alimentos', 2),
  (3, 1, 'Ahorro', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cotizaciones_dolar (fecha, fuente, compra, venta)
VALUES
  (CURRENT_DATE, 'mep', 1125.00, 1130.00),
  (CURRENT_DATE, 'astropay', 1110.00, 1140.00)
ON CONFLICT (fecha, fuente) DO NOTHING;

COMMIT;
