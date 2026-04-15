import { useState } from 'react';

export default function GastosFijosPanel({ gastos, categorias, ciclo, onCrear, onEditar, onAjustar, onEliminarEnCiclo }) {
  const [form, setForm] = useState({
    descripcion: '',
    categoria_id: '',
    moneda: 'ARS',
    monto_base: '',
    dia_vencimiento: ''
  });
  const [gastoEditando, setGastoEditando] = useState(null);
  const [formEditar, setFormEditar] = useState({
    descripcion: '',
    categoria_id: '',
    moneda: 'ARS',
    monto_base: '',
    dia_vencimiento: ''
  });
  const [gastoAjustando, setGastoAjustando] = useState(null);
  const [formAjuste, setFormAjuste] = useState({
    fecha_aplicacion: `${ciclo}-01`,
    tipo_ajuste: 'porcentaje',
    valor: '',
    nota: ''
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

  const abrirAjuste = (gasto) => {
    setGastoAjustando(gasto);
    setFormAjuste({
      fecha_aplicacion: `${ciclo}-01`,
      tipo_ajuste: 'porcentaje',
      valor: '',
      nota: ''
    });
  };

  const confirmarAjuste = async () => {
    if (!gastoAjustando) return;
    await onAjustar(gastoAjustando.id, {
      fecha_aplicacion: formAjuste.fecha_aplicacion,
      tipo_ajuste: formAjuste.tipo_ajuste,
      valor: Number(formAjuste.valor || 0),
      nota: formAjuste.nota || null
    });
    setGastoAjustando(null);
  };

  const abrirEdicion = (gasto) => {
    setGastoEditando(gasto);
    setFormEditar({
      descripcion: gasto.descripcion || '',
      categoria_id: gasto.categoria_id || '',
      moneda: gasto.moneda || 'ARS',
      monto_base: Number(gasto.monto_base || 0),
      dia_vencimiento: gasto.dia_vencimiento || ''
    });
  };

  const confirmarEdicion = async () => {
    if (!gastoEditando) return;
    await onEditar(gastoEditando.id, {
      descripcion: formEditar.descripcion,
      monto_base: Number(formEditar.monto_base || 0),
      categoria_id: formEditar.categoria_id ? Number(formEditar.categoria_id) : null,
      moneda: formEditar.moneda,
      dia_vencimiento: formEditar.dia_vencimiento ? Number(formEditar.dia_vencimiento) : null
    });
    setGastoEditando(null);
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
                    <button type="button" className="btn-inline" onClick={() => abrirEdicion(gasto)}>
                      ✏️
                    </button>
                    <button type="button" className="btn-inline" onClick={() => abrirAjuste(gasto)}>
                      📈
                    </button>
                    <button type="button" className="btn-inline danger" onClick={() => onEliminarEnCiclo(gasto.id)} title={`Desactivar desde ciclo ${ciclo}`}>
                      🗑️ desde ciclo
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

      {gastoEditando && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3>✏️ Editar valor fijo</h3>
              <button type="button" className="close-btn" onClick={() => setGastoEditando(null)}>
                ✕
              </button>
            </div>
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); confirmarEdicion(); }}>
              <label>
                Descripción
                <input value={formEditar.descripcion} onChange={(e) => setFormEditar((p) => ({ ...p, descripcion: e.target.value }))} required />
              </label>
              <label>
                Categoría
                <select value={formEditar.categoria_id} onChange={(e) => setFormEditar((p) => ({ ...p, categoria_id: e.target.value }))} required>
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
                <select value={formEditar.moneda} onChange={(e) => setFormEditar((p) => ({ ...p, moneda: e.target.value }))}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </label>
              <label>
                Monto base
                <input type="number" min="1" value={formEditar.monto_base} onChange={(e) => setFormEditar((p) => ({ ...p, monto_base: e.target.value }))} required />
              </label>
              <label>
                Día vencimiento
                <input type="number" min="1" max="31" value={formEditar.dia_vencimiento} onChange={(e) => setFormEditar((p) => ({ ...p, dia_vencimiento: e.target.value }))} />
              </label>
              <div className="confirm-actions full-width">
                <button type="button" className="btn-inline" onClick={() => setGastoEditando(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-inline success">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {gastoAjustando && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📈 Ajuste de valor fijo</h3>
              <button type="button" className="close-btn" onClick={() => setGastoAjustando(null)}>
                ✕
              </button>
            </div>
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); confirmarAjuste(); }}>
              <label>
                Fecha aplicación
                <input type="date" value={formAjuste.fecha_aplicacion} onChange={(e) => setFormAjuste((p) => ({ ...p, fecha_aplicacion: e.target.value }))} required />
              </label>
              <label>
                Tipo ajuste
                <select value={formAjuste.tipo_ajuste} onChange={(e) => setFormAjuste((p) => ({ ...p, tipo_ajuste: e.target.value }))}>
                  <option value="porcentaje">Porcentaje</option>
                  <option value="monto_fijo">Monto fijo</option>
                </select>
              </label>
              <label>
                Valor
                <input type="number" value={formAjuste.valor} onChange={(e) => setFormAjuste((p) => ({ ...p, valor: e.target.value }))} required />
              </label>
              <label className="full-width">
                Nota
                <input value={formAjuste.nota} onChange={(e) => setFormAjuste((p) => ({ ...p, nota: e.target.value }))} />
              </label>
              <div className="confirm-actions full-width">
                <button type="button" className="btn-inline" onClick={() => setGastoAjustando(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-inline success">
                  Aplicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
