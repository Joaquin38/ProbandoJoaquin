import { useEffect, useMemo, useState } from 'react';
import { createMovimiento, getCategorias, getCotizaciones, getMovimientos, getResumen } from './services/api.js';
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
      await createMovimiento(payload);
      await cargarDatos();
      setOpenModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ultimaActualizacion = useMemo(() => new Date().toLocaleString('es-AR'), [movimientos, resumen, cotizaciones]);

  return (
    <main className="container">
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

      <section className="layout-grid-main">
        <MenuLateral />

        <div className="contenido-dashboard">
          <section className="panel acciones-panel">
            <h2>Movimientos</h2>
            <p>Creá un nuevo movimiento desde un modal para mantener limpio el dashboard.</p>
            <button type="button" onClick={() => setOpenModal(true)}>
              + Nuevo movimiento
            </button>
          </section>

          <MovimientosTable movimientos={movimientos} />
          <CotizacionesPanel cotizaciones={cotizaciones} />
        </div>
      </section>

      {openModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Alta de movimiento</h3>
              <button type="button" className="close-btn" onClick={() => setOpenModal(false)}>
                ✕
              </button>
            </div>
            <NuevoMovimientoForm categorias={categorias} onCrear={handleCrearMovimiento} loading={loading} />
          </div>
        </div>
      )}
    </main>
  );
}
