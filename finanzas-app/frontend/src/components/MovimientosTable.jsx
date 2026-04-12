export default function MovimientosTable({ movimientos }) {
  return (
    <section className="panel">
      <h2>Movimientos</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Monto ARS</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((mov) => (
            <tr key={mov.id}>
              <td>{mov.fecha}</td>
              <td>{mov.tipo_movimiento}</td>
              <td>{mov.categoria || '-'}</td>
              <td>{mov.descripcion || '-'}</td>
              <td>${Number(mov.monto_ars).toLocaleString('es-AR')}</td>
            </tr>
          ))}
          {movimientos.length === 0 && (
            <tr>
              <td colSpan={5}>Todavía no hay movimientos cargados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
