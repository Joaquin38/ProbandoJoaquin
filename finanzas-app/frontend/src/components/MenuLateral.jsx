const items = [
  'Dashboard',
  'Movimientos',
  'Gastos fijos',
  'Cotización dólar',
  'Ahorros',
  'Reportes'
];

export default function MenuLateral() {
  return (
    <aside className="panel menu-lateral">
      <h3>Menú</h3>
      <nav>
        {items.map((item, index) => (
          <button key={item} className={`menu-item ${index === 0 ? 'activo' : ''}`} type="button">
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}
