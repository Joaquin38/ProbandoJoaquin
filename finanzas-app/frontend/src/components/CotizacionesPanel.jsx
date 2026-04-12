export default function CotizacionesPanel({ cotizaciones, onRefrescar }) {
  return (
    <section className="panel cotizaciones-panel">
      <div className="panel-header">
        <h2>Cotización dólar</h2>
        <p>Últimos valores obtenidos automáticamente desde API pública.</p>
      </div>
      <button type="button" onClick={onRefrescar}>
        Actualizar desde API pública
      </button>

      <div className="cotizaciones-grid">
        {cotizaciones.map((coti) => (
          <article key={`${coti.fuente}-${coti.fecha}`} className="cotizacion-item">
            <h4>💱 {coti.fuente}</h4>
            <p>Fecha: {coti.fecha}</p>
            <p>Compra: {coti.compra ? `$${Number(coti.compra).toLocaleString('es-AR')}` : '-'}</p>
            <p>Venta: ${Number(coti.venta || 0).toLocaleString('es-AR')}</p>
          </article>
        ))}
        {cotizaciones.length === 0 && <p>No hay cotizaciones cargadas todavía.</p>}
      </div>
    </section>
  );
}
