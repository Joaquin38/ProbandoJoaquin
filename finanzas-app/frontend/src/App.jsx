import { useEffect, useMemo, useState } from 'react';
import {
  createGastoFijo,
  createCotizacion,
  createMovimiento,
  deleteMovimiento,
  getCategorias,
  getCotizaciones,
  getGastosFijos,
  getMovimientos,
  getResumen,
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

  const cargarDatos = async () => {
    try {
      setError('');
      const [movData, catData, resumenData, cotiData, gastosData] = await Promise.all([
        getMovimientos(1, mostrarEliminados),
        getCategorias(1),
        getResumen(1),
        getCotizaciones(),
        getGastosFijos(1)
      ]);

      setMovimientos(movData.items || []);
      setCategorias(catData.items || []);
      setResumen(resumenData || {});
      setCotizaciones(cotiData.items || []);
      setGastosFijos(gastosData.items || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [mostrarEliminados]);

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
      await createGastoFijo(payload);
      await cargarDatos();
      setSeccionActiva('gastos_fijos');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCrearCotizacion = async (payload) => {
    try {
      setError('');
      await createCotizacion(payload);
      await cargarDatos();
      setSeccionActiva('cotizacion');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditar = (movimiento) => {
    setModoModal('editar');
    setMovimientoEditando(movimiento);
    setOpenModal(true);
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
      new Date().toLocaleDateString('es-AR', {
        month: 'long',
        year: 'numeric'
      }),
    []
  );
  const movimientosConIngresosFijos = useMemo(() => {
    const ventaReferencia = Number(cotizaciones.find((item) => Number(item.venta) > 0)?.venta || 0);
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    const ingresosFijosProyectados = gastosFijos
      .filter((item) => item.tipo_movimiento === 'ingreso')
      .map((item) => {
        const dia = item.dia_vencimiento ? Math.min(Math.max(Number(item.dia_vencimiento), 1), 28) : 1;
        const fecha = new Date(anio, mes, dia).toISOString().slice(0, 10);
        const montoBase = Number(item.monto_base || 0);
        const montoConvertido = item.moneda === 'USD' && ventaReferencia > 0 ? montoBase * ventaReferencia : montoBase;

        return {
          id: `ingreso-fijo-${item.id}`,
          fecha,
          tipo_movimiento: 'ingreso',
          categoria: item.categoria,
          descripcion: `${item.descripcion} (ingreso fijo)`,
          monto_ars: montoConvertido,
          activo: true,
          esProyectado: true
        };
      });

    return [...ingresosFijosProyectados, ...movimientos].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }, [movimientos, gastosFijos, cotizaciones]);

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
            <span className="last-update">Actualizado: {ultimaActualizacion}</span>
          </div>
        </header>

        {error && <p className="error">{error}</p>}

        <ResumenCards resumen={resumen} />

        <div className="contenido-dashboard">
          {(seccionActiva === 'dashboard' || seccionActiva === 'movimientos') && (
            <>
              <section className="panel acciones-panel">
                <h2>Movimientos</h2>
                <p>Creá o editá movimientos desde un modal para mantener limpio el dashboard.</p>
                <button type="button" onClick={abrirModalCrear}>
                  + Nuevo movimiento
                </button>
                <label className="toggle-eliminados">
                  <input
                    type="checkbox"
                    checked={mostrarEliminados}
                    onChange={(e) => setMostrarEliminados(e.target.checked)}
                  />
                  Ver eliminados
                </label>
              </section>

              <MovimientosTable movimientos={movimientosConIngresosFijos} onEditar={handleEditar} onEliminar={handleEliminar} />
            </>
          )}

          {(seccionActiva === 'dashboard' || seccionActiva === 'cotizacion') && (
            <CotizacionesPanel cotizaciones={cotizaciones} onCrear={handleCrearCotizacion} />
          )}

          {seccionActiva === 'gastos_fijos' && (
            <GastosFijosPanel gastos={gastosFijos} categorias={categorias} onCrear={handleCrearGastoFijo} />
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
    </main>
  );
}
