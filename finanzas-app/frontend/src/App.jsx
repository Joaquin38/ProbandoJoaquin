import { useEffect, useMemo, useState } from 'react';
import {
  createAjusteGastoFijo,
  createGastoFijo,
  createMovimiento,
  deleteGastoFijoEnCiclo,
  deleteMovimiento,
  getCategorias,
  getCotizaciones,
  getGastosFijos,
  getMovimientos,
  getResumen,
  updateGastoFijo,
  updateMovimiento
} from './services/api.js';
import ResumenCards from './components/ResumenCards.jsx';
import MovimientosTable from './components/MovimientosTable.jsx';
import NuevoMovimientoForm from './components/NuevoMovimientoForm.jsx';
import MenuLateral from './components/MenuLateral.jsx';
import CotizacionesPanel from './components/CotizacionesPanel.jsx';
import GastosFijosPanel from './components/GastosFijosPanel.jsx';

export default function App() {
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [gastosFijos, setGastosFijos] = useState([]);
  const [resumen, setResumen] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [movimientoEditando, setMovimientoEditando] = useState(null);
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('dashboard');
  const [mostrarEliminados, setMostrarEliminados] = useState(false);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(new Date().toISOString().slice(0, 7));
  const [fijoEditModal, setFijoEditModal] = useState(null);
  const [fijoEditForm, setFijoEditForm] = useState({
    gasto_fijo_id: null,
    descripcion: '',
    categoria_id: '',
    moneda: 'ARS',
    monto_base: '',
    dia_vencimiento: '',
    monto_ciclo: ''
  });
  const [filtrosGrilla, setFiltrosGrilla] = useState({
    fechaDesde: '',
    fechaHasta: '',
    tipoMovimiento: '',
    categoria: ''
  });
  const [ordenGrilla, setOrdenGrilla] = useState({
    campo: 'fecha',
    direccion: 'desc'
  });
  const [estadoOverrides, setEstadoOverrides] = useState({});

  const getEstadoMovimiento = (mov) => {
    const override = estadoOverrides[mov.id];
    if (override) return override;
    if (mov.tipo_movimiento === 'egreso') return mov.estado_egreso || 'pendiente';
    if (['ingreso', 'ahorro'].includes(mov.tipo_movimiento)) {
      return mov.estado_ingreso || (mov.esProyectado ? 'proyectado' : 'registrado');
    }
    return 'registrado';
  };

  const toggleEstadoMovimiento = async (mov) => {
    const estadoActual = getEstadoMovimiento(mov);
    let siguiente = estadoActual;

    if (mov.tipo_movimiento === 'egreso') {
      siguiente = estadoActual === 'pagado' ? 'pendiente' : 'pagado';
    } else if (['ingreso', 'ahorro'].includes(mov.tipo_movimiento)) {
      siguiente = estadoActual === 'registrado' ? 'proyectado' : 'registrado';
    } else {
      return;
    }

    setEstadoOverrides((prev) => ({ ...prev, [mov.id]: siguiente }));

    if (mov.esProyectado) return;

    try {
      setError('');
      if (mov.tipo_movimiento === 'egreso') {
        await updateMovimiento(mov.id, { estado_egreso: siguiente });
      } else if (['ingreso', 'ahorro'].includes(mov.tipo_movimiento)) {
        await updateMovimiento(mov.id, { estado_ingreso: siguiente });
      }
      await cargarDatos();
    } catch (err) {
      setEstadoOverrides((prev) => ({ ...prev, [mov.id]: estadoActual }));
      setError(err.message);
    }
  };

  const cargarDatos = async () => {
    try {
      setError('');
      const [movData, catData, resumenData, cotiData, gastosData] = await Promise.allSettled([
        getMovimientos(1, mostrarEliminados, cicloSeleccionado),
        getCategorias(1),
        getResumen(1, cicloSeleccionado),
        getCotizaciones(),
        getGastosFijos(1, cicloSeleccionado)
      ]);

      if (movData.status === 'fulfilled') setMovimientos(movData.value.items || []);
      if (catData.status === 'fulfilled') setCategorias(catData.value.items || []);
      if (resumenData.status === 'fulfilled') setResumen(resumenData.value || {});
      if (cotiData.status === 'fulfilled') setCotizaciones(cotiData.value.items || []);
      if (gastosData.status === 'fulfilled') setGastosFijos(gastosData.value.items || []);

      const errores = [movData, catData, resumenData, cotiData, gastosData].filter((r) => r.status === 'rejected');
      if (errores.length > 0) {
        setError(errores[0].reason?.message || 'Hubo errores parciales al cargar el dashboard');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [mostrarEliminados, cicloSeleccionado]);

  const handleCrearMovimiento = async (payload) => {
    try {
      setLoading(true);
      setError('');

      if (modoModal === 'editar' && movimientoEditando) {
        await updateMovimiento(movimientoEditando.id, {
          descripcion: payload.descripcion,
          categoria_id: payload.categoria_id,
          cuenta_id: payload.cuenta_id
        });
      } else {
        await createMovimiento(payload);
      }

      await cargarDatos();
      setOpenModal(false);
      setMovimientoEditando(null);
      setModoModal('crear');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearGastoFijo = async (payload) => {
    try {
      setError('');
      await createGastoFijo({ ...payload, ciclo_desde: cicloSeleccionado });
      await cargarDatos();
      setSeccionActiva('gastos_fijos');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditarGastoFijo = async (id, payload) => {
    try {
      setError('');
      await updateGastoFijo(id, payload);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAjustarGastoFijo = async (id, payload) => {
    try {
      setError('');
      await createAjusteGastoFijo(id, payload);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminarGastoFijoEnCiclo = async (id) => {
    try {
      setError('');
      await deleteGastoFijoEnCiclo(id, cicloSeleccionado);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditar = (movimiento) => {
    setModoModal('editar');
    setMovimientoEditando(movimiento);
    setOpenModal(true);
  };

  const handleEditarFijoEnGrilla = async (movimiento) => {
    const gasto = gastosFijos.find((item) => Number(item.id) === Number(movimiento.gasto_fijo_id));
    if (!gasto) return;
    setFijoEditModal(movimiento);
    setFijoEditForm({
      gasto_fijo_id: gasto.id,
      descripcion: gasto.descripcion || '',
      categoria_id: gasto.categoria_id || '',
      moneda: gasto.moneda || 'ARS',
      monto_base: Number(gasto.monto_base || 0),
      dia_vencimiento: gasto.dia_vencimiento || '',
      monto_ciclo: Number(movimiento.monto_ars || 0)
    });
  };

  const confirmarEditarFijoEnGrilla = async () => {
    if (!fijoEditModal || !fijoEditForm.gasto_fijo_id) return;
    const montoActual = Number(fijoEditModal.monto_ars || 0);
    const nuevoMontoCiclo = Number(fijoEditForm.monto_ciclo || 0);
    const delta = nuevoMontoCiclo - montoActual;

    await handleEditarGastoFijo(fijoEditForm.gasto_fijo_id, {
      descripcion: fijoEditForm.descripcion,
      categoria_id: fijoEditForm.categoria_id ? Number(fijoEditForm.categoria_id) : null,
      moneda: fijoEditForm.moneda,
      monto_base: Number(fijoEditForm.monto_base || 0),
      dia_vencimiento: fijoEditForm.dia_vencimiento ? Number(fijoEditForm.dia_vencimiento) : null
    });

    if (delta !== 0) {
      await handleAjustarGastoFijo(fijoEditForm.gasto_fijo_id, {
        fecha_aplicacion: `${cicloSeleccionado}-01`,
        tipo_ajuste: 'monto_fijo',
        valor: delta,
        nota: `Ajuste desde grilla para ciclo ${cicloSeleccionado}`
      });
    }

    setFijoEditModal(null);
  };

  const handleEliminarFijoEnGrilla = async (movimiento) => {
    await handleEliminarGastoFijoEnCiclo(movimiento.gasto_fijo_id);
  };

  const handleEliminar = async (id) => {
    setDeleteTargetId(id);
  };

  const confirmarEliminar = async () => {
    if (!deleteTargetId) return;

    try {
      setError('');
      await deleteMovimiento(deleteTargetId);
      await cargarDatos();
      setDeleteTargetId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const abrirModalCrear = () => {
    setModoModal('crear');
    setMovimientoEditando(null);
    setOpenModal(true);
  };

  const ultimaActualizacion = useMemo(() => new Date().toLocaleString('es-AR'), [movimientos, resumen, cotizaciones, gastosFijos]);
  const cicloActual = useMemo(
    () =>
      new Date(`${cicloSeleccionado}-01T00:00:00`).toLocaleDateString('es-AR', {
        month: 'long',
        year: 'numeric'
      }),
    [cicloSeleccionado]
  );
  const movimientosConValoresFijos = useMemo(() => {
    const ventaReferencia = Number(cotizaciones.find((item) => Number(item.venta) > 0)?.venta || 0);
    const [anio, mesTexto] = cicloSeleccionado.split('-');
    const hoy = new Date();
    const anioNumero = Number.isFinite(Number(anio)) ? Number(anio) : hoy.getFullYear();
    const mesNumero = Number.isFinite(Number(mesTexto)) ? Math.max(Number(mesTexto) - 1, 0) : hoy.getMonth();

    const valoresFijosProyectados = gastosFijos
      .filter((item) => ['ingreso', 'egreso'].includes(item.tipo_movimiento))
      .map((item) => {
        const dia = item.dia_vencimiento ? Math.min(Math.max(Number(item.dia_vencimiento), 1), 28) : 1;
        const fecha = new Date(anioNumero, mesNumero, dia).toISOString().slice(0, 10);
        const montoBase = Number(item.monto_base || 0);
        const montoConvertido = item.moneda === 'USD' && ventaReferencia > 0 ? montoBase * ventaReferencia : montoBase;

        return {
          id: `valor-fijo-${item.id}`,
          gasto_fijo_id: item.id,
          fecha,
          tipo_movimiento: item.tipo_movimiento,
          categoria: item.categoria,
          descripcion: `${item.descripcion} (valor fijo)`,
          monto_ars: montoConvertido,
          activo: true,
          esProyectado: true
        };
      });

    const movimientosOrdenados = [...movimientos].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    return [...valoresFijosProyectados, ...movimientosOrdenados];
  }, [movimientos, gastosFijos, cotizaciones, cicloSeleccionado]);

  const movimientosFiltradosYOrdenados = useMemo(() => {
    let items = [...movimientosConValoresFijos];

    if (filtrosGrilla.fechaDesde) {
      items = items.filter((mov) => String(mov.fecha) >= filtrosGrilla.fechaDesde);
    }
    if (filtrosGrilla.fechaHasta) {
      items = items.filter((mov) => String(mov.fecha) <= filtrosGrilla.fechaHasta);
    }
    if (filtrosGrilla.tipoMovimiento) {
      items = items.filter((mov) => mov.tipo_movimiento === filtrosGrilla.tipoMovimiento);
    }
    if (filtrosGrilla.categoria) {
      items = items.filter((mov) => String(mov.categoria || '') === filtrosGrilla.categoria);
    }

    const { campo, direccion } = ordenGrilla;
    const factor = direccion === 'asc' ? 1 : -1;
    items.sort((a, b) => {
      if (a.esProyectado && !b.esProyectado) return -1;
      if (!a.esProyectado && b.esProyectado) return 1;

      const normalize = (item) => {
        if (campo === 'estado') return getEstadoMovimiento(item);
        return item[campo] ?? '';
      };
      const av = normalize(a);
      const bv = normalize(b);
      if (campo === 'monto_ars') return (Number(av) - Number(bv)) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });

    return items;
  }, [movimientosConValoresFijos, filtrosGrilla, ordenGrilla, estadoOverrides]);

  const resumenCalculado = useMemo(() => {
    const base = resumen || {};
    const ingresosRegistrados = movimientosConValoresFijos
      .filter((mov) => mov.tipo_movimiento === 'ingreso' && getEstadoMovimiento(mov) === 'registrado')
      .reduce((acc, mov) => acc + Number(mov.monto_ars || 0), 0);
    const egresosPagados = movimientosConValoresFijos
      .filter((mov) => mov.tipo_movimiento === 'egreso' && getEstadoMovimiento(mov) === 'pagado')
      .reduce((acc, mov) => acc + Number(mov.monto_ars || 0), 0);
    const ingresosTotales = movimientosConValoresFijos
      .filter((mov) => mov.tipo_movimiento === 'ingreso')
      .reduce((acc, mov) => acc + Number(mov.monto_ars || 0), 0);
    const egresosTotales = movimientosConValoresFijos
      .filter((mov) => mov.tipo_movimiento === 'egreso')
      .reduce((acc, mov) => acc + Number(mov.monto_ars || 0), 0);

    return {
      ...base,
      balance_actual: ingresosRegistrados - egresosPagados,
      balance_proyectado: ingresosTotales - egresosTotales
    };
  }, [movimientosConValoresFijos, resumen]);

  return (
    <main className={`container ${menuCollapsed ? 'menu-colapsado' : ''}`}>
      <MenuLateral
        collapsed={menuCollapsed}
        onToggle={() => setMenuCollapsed((v) => !v)}
        active={seccionActiva}
        onSelect={setSeccionActiva}
      />

      <div className="contenido-principal">
        <header className="hero">
          <div>
            <p className="eyebrow">Finanzas personales</p>
            <h1>Panel mensual</h1>
            <p className="subtitle">Controlá ingresos, egresos y ahorro sin depender de Excel.</p>
          </div>
          <div className="hero-meta">
            <span className="pill">Hogar demo #1</span>
            <span className="pill muted">Ciclo: {cicloActual}</span>
            <label className="selector-ciclo">
              Mes
              <input type="month" value={cicloSeleccionado} onChange={(e) => setCicloSeleccionado(e.target.value)} />
            </label>
            <span className="last-update">Actualizado: {ultimaActualizacion}</span>
          </div>
        </header>

        {error && <p className="error">{error}</p>}

        <ResumenCards resumen={resumenCalculado} />

        <div className="contenido-dashboard">
          {(seccionActiva === 'dashboard' || seccionActiva === 'movimientos') && (
            <>
              <MovimientosTable
                movimientos={movimientosFiltradosYOrdenados}
                categoriasDisponibles={Array.from(
                  new Set(movimientosConValoresFijos.map((mov) => mov.categoria).filter(Boolean))
                ).sort((a, b) => String(a).localeCompare(String(b)))}
                onEditar={handleEditar}
                onEliminar={handleEliminar}
                onNuevo={abrirModalCrear}
                mostrarEliminados={mostrarEliminados}
                onToggleEliminados={setMostrarEliminados}
                onEditarFijo={handleEditarFijoEnGrilla}
                onEliminarFijo={handleEliminarFijoEnGrilla}
                filtros={filtrosGrilla}
                onFiltrosChange={setFiltrosGrilla}
                orden={ordenGrilla}
                onOrdenChange={setOrdenGrilla}
                getEstadoMovimiento={getEstadoMovimiento}
                onToggleEstadoPago={toggleEstadoMovimiento}
              />
            </>
          )}

          {(seccionActiva === 'dashboard' || seccionActiva === 'cotizacion') && (
            <CotizacionesPanel cotizaciones={cotizaciones} onRefrescar={cargarDatos} />
          )}

          {seccionActiva === 'gastos_fijos' && (
            <GastosFijosPanel
              gastos={gastosFijos}
              categorias={categorias}
              ciclo={cicloSeleccionado}
              onCrear={handleCrearGastoFijo}
              onEditar={handleEditarGastoFijo}
              onAjustar={handleAjustarGastoFijo}
              onEliminarEnCiclo={handleEliminarGastoFijoEnCiclo}
            />
          )}

          {seccionActiva === 'ahorros' && (
            <section className="panel">
              <h2>🏦 Ahorros</h2>
              <p>Próximo paso: vista dedicada para evolución de ahorro en ARS/USD.</p>
            </section>
          )}

          {seccionActiva === 'reportes' && (
            <section className="panel">
              <h2>📊 Reportes</h2>
              <p>Próximo paso: comparativas por mes, categoría y tendencia.</p>
            </section>
          )}
        </div>
      </div>

      {openModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modoModal === 'editar' ? 'Editar movimiento' : 'Alta de movimiento'}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setOpenModal(false);
                  setModoModal('crear');
                  setMovimientoEditando(null);
                }}
              >
                ✕
              </button>
            </div>
            <NuevoMovimientoForm
              categorias={categorias}
              onCrear={handleCrearMovimiento}
              loading={loading}
              modo={modoModal}
              initialValues={movimientoEditando}
            />
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content confirm-modal">
            <h3>🗑️ Confirmar eliminación</h3>
            <p>¿Seguro querés eliminar este movimiento? Esta acción no se puede deshacer.</p>
            <div className="confirm-actions">
              <button type="button" className="btn-inline" onClick={() => setDeleteTargetId(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-inline danger" onClick={confirmarEliminar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {fijoEditModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3>✏️ Editar valor fijo</h3>
              <button type="button" className="close-btn" onClick={() => setFijoEditModal(null)}>
                ✕
              </button>
            </div>

            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); confirmarEditarFijoEnGrilla(); }}>
              <label>
                Descripción
                <input
                  value={fijoEditForm.descripcion}
                  onChange={(e) => setFijoEditForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  required
                />
              </label>
              <label>
                Categoría
                <select
                  value={fijoEditForm.categoria_id}
                  onChange={(e) => setFijoEditForm((prev) => ({ ...prev, categoria_id: e.target.value }))}
                  required
                >
                  <option value="">Seleccionar</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Moneda
                <select value={fijoEditForm.moneda} onChange={(e) => setFijoEditForm((prev) => ({ ...prev, moneda: e.target.value }))}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </label>
              <label>
                Monto base
                <input
                  type="number"
                  min="1"
                  value={fijoEditForm.monto_base}
                  onChange={(e) => setFijoEditForm((prev) => ({ ...prev, monto_base: e.target.value }))}
                  required
                />
              </label>
              <label>
                Día vencimiento
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={fijoEditForm.dia_vencimiento}
                  onChange={(e) => setFijoEditForm((prev) => ({ ...prev, dia_vencimiento: e.target.value }))}
                />
              </label>
              <label>
                Monto en ciclo {cicloSeleccionado}
                <input
                  type="number"
                  min="0"
                  value={fijoEditForm.monto_ciclo}
                  onChange={(e) => setFijoEditForm((prev) => ({ ...prev, monto_ciclo: e.target.value }))}
                />
              </label>
              <div className="confirm-actions full-width">
                <button type="button" className="btn-inline" onClick={() => setFijoEditModal(null)}>
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
    </main>
  );
}
