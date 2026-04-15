function formatFecha(fecha) {
  if (!fecha) return '-';
  const raw = String(fecha);
  const matchIso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchIso) {
    const [, anio, mes, dia] = matchIso;
    return `${dia}/${mes}/${anio}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return fecha;
  const dia = String(date.getUTCDate()).padStart(2, '0');
  const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
  const anio = date.getUTCFullYear();
  return `${dia}/${mes}/${anio}`;
}

export default function MovimientosTable({
  movimientos,
  categoriasDisponibles = [],
  onEditar,
  onEliminar,
  onNuevo,
  mostrarEliminados,
  onToggleEliminados,
  onEditarFijo,
  onEliminarFijo,
  filtros,
  onFiltrosChange,
  orden,
  onOrdenChange,
  getEstadoMovimiento,
  onToggleEstadoPago
}) {
  const resolverEstado = getEstadoMovimiento || ((mov) => (mov.esProyectado ? 'proyectado' : mov.activo ? 'pagado' : 'pendiente'));
  const etiquetaEstado = (mov) => {
    const estado = resolverEstado(mov);
    if (mov.tipo_movimiento === 'ingreso' && estado === 'registrado') return 'cobrado';
    return estado;
  };
  const sortIndicator = (campo) => (orden.campo === campo ? (orden.direccion === 'asc' ? ' ▲' : ' ▼') : '');
  const toggleSort = (campo) => {
    onOrdenChange((prev) => {
      if (prev.campo === campo) {
        return { campo, direccion: prev.direccion === 'asc' ? 'desc' : 'asc' };
      }
      return { campo, direccion: 'asc' };
    });
  };

  return (
    <section className="panel panel-table">
      <div className="panel-header table-header">
        <div>
          <h2>Movimientos recientes</h2>
          <span className="pill muted">{movimientos.length} registros</span>
        </div>
        <div className="table-actions">
          <button type="button" onClick={onNuevo}>
            + Nuevo movimiento
          </button>
          <label className="toggle-eliminados">
            <input type="checkbox" checked={mostrarEliminados} onChange={(e) => onToggleEliminados(e.target.checked)} />
            Ver eliminados
          </label>
        </div>
      </div>
      <div className="table-filters">
        <label>
          Desde
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => onFiltrosChange((prev) => ({ ...prev, fechaDesde: e.target.value }))}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => onFiltrosChange((prev) => ({ ...prev, fechaHasta: e.target.value }))}
          />
        </label>
        <label>
          Tipo
          <select
            value={filtros.tipoMovimiento}
            onChange={(e) => onFiltrosChange((prev) => ({ ...prev, tipoMovimiento: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
            <option value="ahorro">Ahorro</option>
          </select>
        </label>
        <label>
          Categoría
          <select value={filtros.categoria} onChange={(e) => onFiltrosChange((prev) => ({ ...prev, categoria: e.target.value }))}>
            <option value="">Todas</option>
            {categoriasDisponibles.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="table-legend">
        <strong>Estados:</strong> egreso → pendiente/pagado · ingreso → proyectado/cobrado · ahorro → proyectado/registrado.
      </p>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('fecha')}>Fecha{sortIndicator('fecha')}</th>
              <th className="sortable" onClick={() => toggleSort('tipo_movimiento')}>Tipo{sortIndicator('tipo_movimiento')}</th>
              <th className="sortable" onClick={() => toggleSort('categoria')}>Categoría{sortIndicator('categoria')}</th>
              <th>Descripción</th>
              <th className="sortable" onClick={() => toggleSort('monto_ars')}>Monto ARS{sortIndicator('monto_ars')}</th>
              <th className="sortable" onClick={() => toggleSort('estado')}>Estado{sortIndicator('estado')}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((mov) => (
              <tr key={mov.id} className={mov.esProyectado ? 'row-proyectado' : ''}>
                <td>{formatFecha(mov.fecha)}</td>
                <td>
                  <span className={`badge badge-${mov.tipo_movimiento}`}>{mov.tipo_movimiento}</span>
                  {mov.esProyectado && <span className="badge badge-fijo">fijo</span>}
                  <span className="badge badge-origen">{mov.esProyectado ? 'proyección' : 'manual'}</span>
                </td>
                <td>{mov.categoria || '-'}</td>
                <td>
                  {mov.descripcion || '-'}
                  {mov.usa_ahorro && <span className="badge badge-fijo">usa ahorro</span>}
                </td>
                <td>${Number(mov.monto_ars).toLocaleString('es-AR')}</td>
                <td>
                  <span className={`badge badge-estado-${resolverEstado(mov)}`}>
                    {etiquetaEstado(mov)}
                  </span>
                </td>
                <td>
                  <div className="acciones-inline">
                    {['egreso', 'ingreso', 'ahorro'].includes(mov.tipo_movimiento) && (
                      <button
                        type="button"
                        className={`btn-inline ${['pagado', 'registrado'].includes(resolverEstado(mov)) ? 'success' : ''}`}
                        title={
                          mov.tipo_movimiento === 'egreso'
                            ? resolverEstado(mov) === 'pagado'
                              ? 'Marcar pendiente'
                              : 'Marcar pagado'
                            : resolverEstado(mov) === 'registrado'
                            ? 'Volver a proyectado'
                            : mov.tipo_movimiento === 'ingreso'
                            ? 'Marcar cobrado'
                            : 'Marcar registrado'
                        }
                        onClick={() => onToggleEstadoPago?.(mov)}
                      >
                        {mov.tipo_movimiento === 'egreso'
                          ? resolverEstado(mov) === 'pagado'
                            ? '↩️'
                            : '✅'
                          : resolverEstado(mov) === 'registrado'
                          ? '↩️'
                          : mov.tipo_movimiento === 'ingreso'
                          ? '🧾'
                          : '🏦'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-inline secondary"
                      title="Editar"
                      disabled={!mov.activo}
                      onClick={() => (mov.esProyectado ? onEditarFijo?.(mov) : onEditar(mov))}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-inline danger"
                      title="Eliminar"
                      disabled={!mov.activo}
                      onClick={() => (mov.esProyectado ? onEliminarFijo?.(mov) : onEliminar(mov.id))}
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
