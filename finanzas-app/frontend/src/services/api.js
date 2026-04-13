const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getRangoCiclo(ciclo) {
  if (!/^\d{4}-\d{2}$/.test(ciclo || '')) return null;

  const [anioTexto, mesTexto] = ciclo.split('-');
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) return null;

  const ultimoDia = new Date(anio, mes, 0).getDate();
  const desde = `${ciclo}-01`;
  const hasta = `${ciclo}-${String(ultimoDia).padStart(2, '0')}`;
  return { desde, hasta };
}

function normalizeFetchError(error) {
  if (error?.name === 'TypeError') {
    return 'No se pudo conectar con la API. Verificá que backend esté levantado en http://localhost:3000 y reiniciá npm run dev.';
  }
  return error?.message || 'Ocurrió un error inesperado';
}

export async function getMovimientos(hogarId = 1, incluirEliminados = false, ciclo) {
  try {
    const searchParams = new URLSearchParams({
      hogar_id: String(hogarId),
      incluir_eliminados: String(incluirEliminados)
    });

    const rango = getRangoCiclo(ciclo);
    if (rango) {
      searchParams.set('desde', rango.desde);
      searchParams.set('hasta', rango.hasta);
    }

    const response = await fetch(`${API_URL}/movimientos?${searchParams.toString()}`);
    if (!response.ok) throw new Error('No se pudieron obtener movimientos');
    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function getResumen(hogarId = 1) {
  try {
    const response = await fetch(`${API_URL}/dashboard/resumen?hogar_id=${hogarId}`);
    if (!response.ok) throw new Error('No se pudo obtener resumen');
    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function createMovimiento(payload) {
  try {
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
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function updateMovimiento(id, payload) {
  try {
    const response = await fetch(`${API_URL}/movimientos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || 'No se pudo actualizar el movimiento');
    }

    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function deleteMovimiento(id) {
  try {
    const response = await fetch(`${API_URL}/movimientos/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || 'No se pudo eliminar el movimiento');
    }

    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function getCategorias(hogarId = 1) {
  try {
    const response = await fetch(`${API_URL}/categorias?hogar_id=${hogarId}`);
    if (!response.ok) throw new Error('No se pudieron obtener categorías');
    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function getCotizaciones(fecha) {
  const url = fecha ? `${API_URL}/cotizaciones?fecha=${fecha}` : `${API_URL}/cotizaciones`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudieron obtener cotizaciones');
    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function getGastosFijos(hogarId = 1, ciclo) {
  try {
    const searchParams = new URLSearchParams({ hogar_id: String(hogarId) });
    if (ciclo) searchParams.set('ciclo', ciclo);
    const response = await fetch(`${API_URL}/gastos-fijos?${searchParams.toString()}`);
    if (!response.ok) throw new Error('No se pudieron obtener valores fijos');
    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function updateGastoFijo(id, payload) {
  try {
    const response = await fetch(`${API_URL}/gastos-fijos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || 'No se pudo actualizar el valor fijo');
    }
    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function createAjusteGastoFijo(id, payload) {
  try {
    const response = await fetch(`${API_URL}/gastos-fijos/${id}/ajustes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || 'No se pudo crear el ajuste');
    }
    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function deleteGastoFijoEnCiclo(id, ciclo) {
  try {
    const query = ciclo ? `?ciclo=${encodeURIComponent(ciclo)}` : '';
    const response = await fetch(`${API_URL}/gastos-fijos/${id}${query}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || 'No se pudo eliminar el valor fijo para el ciclo');
    }
    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}

export async function createGastoFijo(payload) {
  try {
    const response = await fetch(`${API_URL}/gastos-fijos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || 'No se pudo crear el valor fijo');
    }

    return response.json();
  } catch (error) {
    throw new Error(normalizeFetchError(error));
  }
}
