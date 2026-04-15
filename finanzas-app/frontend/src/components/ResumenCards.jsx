function FormattedAmount({ value }) {
  return <strong>${Number(value || 0).toLocaleString('es-AR')}</strong>;
}

export default function ResumenCards({ resumen }) {
  const { ingresos = 0, egresos = 0, ahorros = 0, balance_actual = 0, balance_proyectado = 0 } = resumen || {};

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
        <h3>⚖️ Balance actual</h3>
        <small>Ingresos registrados − egresos pagados</small>
        <p className={balance_actual >= 0 ? 'positivo' : 'negativo'}>
          <FormattedAmount value={balance_actual} />
        </p>
      </article>

      <article className="card card-balance">
        <h3>🧮 Balance proyectado</h3>
        <small>Todos los ingresos − todos los egresos</small>
        <p className={balance_proyectado >= 0 ? 'positivo' : 'negativo'}>
          <FormattedAmount value={balance_proyectado} />
        </p>
      </article>
    </section>
  );
}
