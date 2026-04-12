import { useState } from 'react';

export default function GastosFijosPanel({ gastos, categorias, onCrear }) {
  const [form, setForm] = useState({
    descripcion: '',
    categoria_id: '',
    moneda: 'ARS',
    monto_base: '',
    dia_vencimiento: ''
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCrear({
      hogar_id: 1,
      descripcion: form.descripcion,
      categoria_id: Number(form.categoria_id),
      moneda: form.moneda,
      monto_base: Number(form.monto_base),
      dia_vencimiento: form.dia_vencimiento ? Number(form.dia_vencimiento) : null
    });

    setForm({ descripcion: '', categoria_id: '', moneda: 'ARS', monto_base: '', dia_vencimiento: '' });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>📌 Gastos fijos</h2>
        <p>Definí costos recurrentes para proyectar mejor tu mes.</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Descripción
          <input value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} required />
        </label>

        <label>
          Categoría
          <select value={form.categoria_id} onChange={(e) => setForm((p) => ({ ...p, categoria_id: e.target.value }))} required>
            <option value="">Seleccionar</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Moneda
          <select value={form.moneda} onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </label>

        <label>
          Monto base
          <input type="number" min="1" value={form.monto_base} onChange={(e) => setForm((p) => ({ ...p, monto_base: e.target.value }))} required />
        </label>

        <label>
          Día vencimiento
          <input type="number" min="1" max="31" value={form.dia_vencimiento} onChange={(e) => setForm((p) => ({ ...p, dia_vencimiento: e.target.value }))} />
        </label>

        <button type="submit">Guardar gasto fijo</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Moneda</th>
              <th>Monto</th>
              <th>Día</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map((gasto) => (
              <tr key={gasto.id}>
                <td>{gasto.descripcion}</td>
                <td>{gasto.categoria}</td>
                <td>{gasto.moneda}</td>
                <td>{Number(gasto.monto_base).toLocaleString('es-AR')}</td>
                <td>{gasto.dia_vencimiento || '-'}</td>
              </tr>
            ))}
            {gastos.length === 0 && (
              <tr>
                <td colSpan={5}>Todavía no hay gastos fijos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
