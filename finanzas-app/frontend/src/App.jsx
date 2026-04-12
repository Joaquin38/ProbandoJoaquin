import { useEffect, useMemo, useState } from 'react';
import {
  createMovimiento,
  deleteMovimiento,
  getCategorias,
  getCotizaciones,
  getMovimientos,
  getResumen,
  updateMovimiento
} from './services/api.js';
import ResumenCards from './components/ResumenCards.jsx';
import MovimientosTable from './components/MovimientosTable.jsx';
import NuevoMovimientoForm from './components/NuevoMovimientoForm.jsx';
import MenuLateral from './components/MenuLateral.jsx';
import CotizacionesPanel from './components/CotizacionesPanel.jsx';

export default function App() {
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [resumen, setResumen] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [movimientoEditando, setMovimientoEditando] = useState(null);
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const cargarDatos = async () => {
    try {
      setError('');
      const [movData, catData, resumenData, cotiData] = await Promise.all([
        getMovimientos(1),
        getCategorias(1),
        getResumen(1),
        getCotizaciones()
      ]);

      setMovimientos(movData.items || []);
      setCategorias(catData.items || []);
      setResumen(resumenData || {});
      setCotizaciones(cotiData.items || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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

  const ultimaActualizacion = useMemo(() => new Date().toLocaleString('es-AR'), [movimientos, resumen, cotizaciones]);

  return (
    <main className={`container ${menuCollapsed ? 'menu-colapsado' : ''}`}>
      <MenuLateral collapsed={menuCollapsed} onToggle={() => setMenuCollapsed((v) => !v)} />

      <div className="contenido-principal">
        <header className="hero">
          <div>
            <p className="eyebrow">Finanzas personales</p>
            <h1>Panel mensual</h1>
            <p className="subtitle">Controlá ingresos, egresos y ahorro sin depender de Excel.</p>
          </div>
          <div className="hero-meta">
            <span className="pill">Hogar demo #1</span>
            <span className="last-update">Actualizado: {ultimaActualizacion}</span>
          </div>
        </header>

        {error && <p className="error">{error}</p>}

        <ResumenCards resumen={resumen} />

        <div className="contenido-dashboard">
          <section className="panel acciones-panel">
            <h2>Movimientos</h2>
            <p>Creá o editá movimientos desde un modal para mantener limpio el dashboard.</p>
            <button type="button" onClick={abrirModalCrear}>
              + Nuevo movimiento
            </button>
          </section>

          <MovimientosTable movimientos={movimientos} onEditar={handleEditar} onEliminar={handleEliminar} />
          <CotizacionesPanel cotizaciones={cotizaciones} />
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
