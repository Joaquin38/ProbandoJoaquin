const items = ['Dashboard', 'Movimientos', 'Gastos fijos', 'Cotización dólar', 'Ahorros', 'Reportes'];

export default function MenuLateral({ collapsed, onToggle }) {
  return (
    <aside className={`menu-shell ${collapsed ? 'collapsed' : ''}`}>
      <div className="menu-top">
        <h3>{collapsed ? '☰' : 'Menú'}</h3>
        <button type="button" className="toggle-menu" onClick={onToggle}>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav>
        {items.map((item, index) => (
          <button key={item} className={`menu-item ${index === 0 ? 'activo' : ''}`} type="button" title={item}>
            {collapsed ? item.slice(0, 1) : item}
          </button>
        ))}
      </nav>
    </aside>
  );
}
