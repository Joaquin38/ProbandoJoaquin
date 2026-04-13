import { useState } from 'react';

export default function GastosFijosPanel({ gastos, categorias, ciclo, onCrear, onEditar, onAjustar, onEliminarEnCiclo }) {
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

  const pedirAjuste = async (gasto) => {
    const fechaAplicacion = window.prompt('Fecha de aplicación del ajuste (YYYY-MM-DD):', `${ciclo}-01`);
    if (!fechaAplicacion) return;
    const tipoAjuste = window.prompt("Tipo de ajuste ('porcentaje' o 'monto_fijo'):", 'porcentaje');
    if (!tipoAjuste) return;
    const valorTexto = window.prompt('Valor del ajuste:', '10');
    if (!valorTexto) return;
    const nota = window.prompt('Nota (opcional):', '') || null;

    await onAjustar(gasto.id, {
      fecha_aplicacion: fechaAplicacion,
      tipo_ajuste: tipoAjuste,
      valor: Number(valorTexto),
      nota
    });
  };

  const editarValorFijo = async (gasto) => {
    const descripcion = window.prompt('Descripción:', gasto.descripcion);
    if (!descripcion) return;
    const montoBaseTexto = window.prompt('Monto base:', String(gasto.monto_base));
    if (!montoBaseTexto) return;

    await onEditar(gasto.id, {
      descripcion,
      monto_base: Number(montoBaseTexto),
      categoria_id: gasto.categoria_id || null,
      moneda: gasto.moneda,
      dia_vencimiento: gasto.dia_vencimiento
    });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>📌 Valores fijos</h2>
        <p>Definí importes recurrentes para contemplar gastos e ingresos fijos (por ejemplo, sueldo).</p>
        <p>Ciclo seleccionado: {ciclo}</p>
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

        <button type="submit">Guardar valor fijo</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Moneda</th>
              <th>Monto</th>
              <th>Monto vigente</th>
              <th>Día</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map((gasto) => (
              <tr key={gasto.id}>
                <td>{gasto.descripcion}</td>
                <td>{gasto.categoria}</td>
                <td>{gasto.moneda}</td>
                <td>{Number(gasto.monto_base).toLocaleString('es-AR')}</td>
                <td>{Number(gasto.monto_vigente ?? gasto.monto_base).toLocaleString('es-AR')}</td>
                <td>{gasto.dia_vencimiento || '-'}</td>
                <td>
                  <div className="acciones-inline">
                    <button type="button" className="btn-inline" onClick={() => editarValorFijo(gasto)}>
                      ✏️
                    </button>
                    <button type="button" className="btn-inline" onClick={() => pedirAjuste(gasto)}>
                      📈
                    </button>
                    <button type="button" className="btn-inline danger" onClick={() => onEliminarEnCiclo(gasto.id)}>
                      🗑️ ciclo
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {gastos.length === 0 && (
              <tr>
                <td colSpan={7}>Todavía no hay valores fijos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
