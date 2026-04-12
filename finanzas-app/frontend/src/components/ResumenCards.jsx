export default function ResumenCards({ movimientos }) {
  const ingresos = movimientos
    .filter((m) => m.tipo_movimiento === 'ingreso')
    .reduce((acc, item) => acc + Number(item.monto_ars), 0);

  const egresos = movimientos
    .filter((m) => m.tipo_movimiento === 'egreso')
    .reduce((acc, item) => acc + Number(item.monto_ars), 0);

  const balance = ingresos - egresos;

  return (
    <section className="cards-grid">
      <article className="card">
        <h3>Ingresos (ARS)</h3>
        <p>${ingresos.toLocaleString('es-AR')}</p>
      </article>
      <article className="card">
        <h3>Egresos (ARS)</h3>
        <p>${egresos.toLocaleString('es-AR')}</p>
      </article>
      <article className="card">
        <h3>Balance (ARS)</h3>
        <p className={balance >= 0 ? 'positivo' : 'negativo'}>${balance.toLocaleString('es-AR')}</p>
      </article>
    </section>
  );
}
