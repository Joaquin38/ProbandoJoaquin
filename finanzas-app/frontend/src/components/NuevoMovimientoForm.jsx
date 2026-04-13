import { useEffect, useState } from 'react';

const initialState = {
  fecha: new Date().toISOString().slice(0, 10),
  tipo_movimiento_id: 2,
  categoria_id: '',
  descripcion: '',
  monto_ars: '',
  moneda_original: 'ARS',
  usa_ahorro: false
};

function normalizeInputDate(value) {
  if (!value) return initialState.fecha;
  if (value.includes('T')) return value.slice(0, 10);
  if (value.includes('/')) {
    const [day, month, year] = value.split('/');
    if (day && month && year) return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return value;
}

export default function NuevoMovimientoForm({ categorias, onCrear, loading, modo = 'crear', initialValues = null }) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (!initialValues) {
      setForm(initialState);
      return;
    }

    setForm({
      fecha: normalizeInputDate(initialValues.fecha),
      tipo_movimiento_id:
        initialValues.tipo_movimiento === 'ingreso'
          ? 1
          : initialValues.tipo_movimiento === 'ahorro'
          ? 3
          : 2,
      categoria_id: initialValues.categoria_id || '',
      descripcion: initialValues.descripcion || '',
      monto_ars: Number(initialValues.monto_ars || 0),
      moneda_original: initialState.moneda_original,
      usa_ahorro: Boolean(initialValues.usa_ahorro)
    });
  }, [initialValues]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onCrear({
      hogar_id: 1,
      cuenta_id: 1,
      tipo_movimiento_id: Number(form.tipo_movimiento_id),
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      fecha: form.fecha,
      descripcion: form.descripcion,
      moneda_original: form.moneda_original,
      monto_original: Number(form.monto_ars),
      monto_ars: Number(form.monto_ars),
      usa_ahorro: Number(form.tipo_movimiento_id) === 2 ? Boolean(form.usa_ahorro) : false,
      creado_por_usuario_id: 1
    });

    if (modo === 'crear') {
      setForm((prev) => ({ ...initialState, fecha: prev.fecha }));
    }
  };

  return (
    <section className="panel panel-form">
      <div className="panel-header">
        <h2>{modo === 'editar' ? 'Editar movimiento' : 'Cargar movimiento'}</h2>
        <p>Completá los campos para registrar ingresos, egresos o ahorro.</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Fecha
          <input type="date" value={form.fecha} onChange={(e) => handleChange('fecha', e.target.value)} required />
        </label>

        <label>
          Tipo
          <select value={form.tipo_movimiento_id} onChange={(e) => handleChange('tipo_movimiento_id', e.target.value)}>
            <option value={1}>Ingreso</option>
            <option value={2}>Egreso</option>
            <option value={3}>Ahorro</option>
          </select>
        </label>

        <label>
          Categoría
          <select value={form.categoria_id} onChange={(e) => handleChange('categoria_id', e.target.value)}>
            <option value="">Sin categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Monto ARS
          <input
            type="number"
            min="1"
            value={form.monto_ars}
            onChange={(e) => handleChange('monto_ars', e.target.value)}
            required
          />
        </label>

        <label className="full-width">
          Descripción
          <input
            type="text"
            value={form.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Ej: Supermercado, sueldo, transferencia"
          />
        </label>

        {Number(form.tipo_movimiento_id) === 2 && (
          <label className="full-width">
            <input
              type="checkbox"
              checked={Boolean(form.usa_ahorro)}
              onChange={(e) => handleChange('usa_ahorro', e.target.checked)}
            />
            Este egreso se paga con ahorros acumulados
          </label>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : modo === 'editar' ? 'Guardar cambios' : 'Guardar movimiento'}
        </button>
      </form>
    </section>
  );
}
