import { useEffect, useMemo, useState } from 'react';
import { createMovimiento, getCategorias, getMovimientos } from './services/api.js';
import ResumenCards from './components/ResumenCards.jsx';
import MovimientosTable from './components/MovimientosTable.jsx';
import NuevoMovimientoForm from './components/NuevoMovimientoForm.jsx';

export default function App() {
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    try {
      setError('');
      const [movData, catData] = await Promise.all([getMovimientos(1), getCategorias(1)]);
      setMovimientos(movData.items || []);
      setCategorias(catData.items || []);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ultimaActualizacion = useMemo(() => new Date().toLocaleString('es-AR'), [movimientos]);

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

      <ResumenCards movimientos={movimientos} />

      <section className="layout-grid">
        <NuevoMovimientoForm categorias={categorias} onCrear={handleCrearMovimiento} loading={loading} />
        <MovimientosTable movimientos={movimientos} />
      </section>
    </main>
  );
}
