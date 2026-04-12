export default function MovimientosTable({ movimientos, onEditar, onEliminar }) {
  return (
    <section className="panel panel-table">
      <div className="panel-header table-header">
        <h2>Movimientos recientes</h2>
        <span className="pill muted">{movimientos.length} registros</span>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Monto ARS</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((mov) => (
              <tr key={mov.id} className={mov.esProyectado ? 'row-proyectado' : ''}>
                <td>{mov.fecha}</td>
                <td>
                  <span className={`badge badge-${mov.tipo_movimiento}`}>{mov.tipo_movimiento}</span>
                  {mov.esProyectado && <span className="badge badge-fijo">fijo</span>}
                </td>
                <td>{mov.categoria || '-'}</td>
                <td>{mov.descripcion || '-'}</td>
                <td>${Number(mov.monto_ars).toLocaleString('es-AR')}</td>
                <td>
                  <span className={`badge ${mov.activo ? 'badge-activo' : 'badge-eliminado'}`}>
                    {mov.esProyectado ? 'Proyectado' : mov.activo ? 'Activo' : 'Eliminado'}
                  </span>
                </td>
                <td>
                  <div className="acciones-inline">
                    <button
                      type="button"
                      className="btn-inline"
                      title="Editar"
                      disabled={!mov.activo || mov.esProyectado}
                      onClick={() => onEditar(mov)}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-inline danger"
                      title="Eliminar"
                      disabled={!mov.activo || mov.esProyectado}
                      onClick={() => onEliminar(mov.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={7}>Todavía no hay movimientos cargados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
