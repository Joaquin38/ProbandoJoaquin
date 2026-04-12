function FormattedAmount({ value }) {
  return <strong>${value.toLocaleString('es-AR')}</strong>;
}

export default function ResumenCards({ movimientos }) {
  const ingresos = movimientos
    .filter((m) => m.tipo_movimiento === 'ingreso')
    .reduce((acc, item) => acc + Number(item.monto_ars), 0);

  const egresos = movimientos
    .filter((m) => m.tipo_movimiento === 'egreso')
    .reduce((acc, item) => acc + Number(item.monto_ars), 0);

  const ahorros = movimientos
    .filter((m) => m.tipo_movimiento === 'ahorro')
    .reduce((acc, item) => acc + Number(item.monto_ars), 0);

  const balance = ingresos - egresos;

  return (
    <section className="cards-grid">
      <article className="card card-income">
        <h3>Ingresos</h3>
        <p>
          <FormattedAmount value={ingresos} />
        </p>
      </article>

      <article className="card card-expense">
        <h3>Egresos</h3>
        <p>
          <FormattedAmount value={egresos} />
        </p>
      </article>

      <article className="card card-saving">
        <h3>Ahorro acumulado</h3>
        <p>
          <FormattedAmount value={ahorros} />
        </p>
      </article>

      <article className="card card-balance">
        <h3>Balance</h3>
        <p className={balance >= 0 ? 'positivo' : 'negativo'}>
          <FormattedAmount value={balance} />
        </p>
      </article>
    </section>
  );
}
