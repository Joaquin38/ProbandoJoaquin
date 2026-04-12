import { useState } from 'react';

export default function CotizacionesPanel({ cotizaciones, onCrear }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    fuente: 'mep',
    compra: '',
    venta: ''
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCrear({
      fecha: form.fecha,
      fuente: form.fuente,
      compra: form.compra ? Number(form.compra) : null,
      venta: Number(form.venta)
    });
  };

  return (
    <section className="panel cotizaciones-panel">
      <div className="panel-header">
        <h2>Cotización dólar</h2>
        <p>Últimos valores por fuente cargada.</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Fecha
          <input type="date" value={form.fecha} onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))} required />
        </label>
        <label>
          Fuente
          <input value={form.fuente} onChange={(e) => setForm((p) => ({ ...p, fuente: e.target.value }))} required />
        </label>
        <label>
          Compra
          <input type="number" value={form.compra} onChange={(e) => setForm((p) => ({ ...p, compra: e.target.value }))} />
        </label>
        <label>
          Venta
          <input type="number" value={form.venta} onChange={(e) => setForm((p) => ({ ...p, venta: e.target.value }))} required />
        </label>
        <button type="submit">Guardar cotización</button>
      </form>

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
