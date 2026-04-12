import { useEffect, useState } from 'react';
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

  return (
    <main className="container">
      <header>
        <h1>Finanzas App</h1>
        <p>Panel inicial para gestionar movimientos y ver balance mensual.</p>
      </header>

      {error && <p className="error">{error}</p>}

      <ResumenCards movimientos={movimientos} />
      <NuevoMovimientoForm categorias={categorias} onCrear={handleCrearMovimiento} loading={loading} />
      <MovimientosTable movimientos={movimientos} />
    </main>
  );
}
