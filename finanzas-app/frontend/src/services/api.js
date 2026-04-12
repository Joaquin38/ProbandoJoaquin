const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getMovimientos(hogarId = 1) {
  const response = await fetch(`${API_URL}/movimientos?hogar_id=${hogarId}`);
  if (!response.ok) throw new Error('No se pudieron obtener movimientos');
  return response.json();
}

export async function createMovimiento(payload) {
  const response = await fetch(`${API_URL}/movimientos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || 'No se pudo crear el movimiento');
  }

  return response.json();
}

export async function getCategorias(hogarId = 1) {
  const response = await fetch(`${API_URL}/categorias?hogar_id=${hogarId}`);
  if (!response.ok) throw new Error('No se pudieron obtener categorías');
  return response.json();
}
