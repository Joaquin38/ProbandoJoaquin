function FormattedAmount({ value }) {
  return <strong>${Number(value || 0).toLocaleString('es-AR')}</strong>;
}

export default function ResumenCards({ resumen }) {
  const { ingresos = 0, egresos = 0, ahorros = 0, balance = 0 } = resumen || {};

  return (
    <section className="cards-grid">
      <article className="card card-income">
        <h3>💚 Ingresos</h3>
        <p>
          <FormattedAmount value={ingresos} />
        </p>
      </article>

      <article className="card card-expense">
        <h3>🧾 Egresos</h3>
        <p>
          <FormattedAmount value={egresos} />
        </p>
      </article>

      <article className="card card-saving">
        <h3>🏦 Ahorro acumulado</h3>
        <p>
          <FormattedAmount value={ahorros} />
        </p>
      </article>

      <article className="card card-balance">
        <h3>⚖️ Balance</h3>
        <p className={balance >= 0 ? 'positivo' : 'negativo'}>
          <FormattedAmount value={balance} />
        </p>
      </article>
    </section>
  );
}
