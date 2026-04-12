const items = [
  { label: 'Dashboard', icon: '🏠' },
  { label: 'Movimientos', icon: '💸' },
  { label: 'Gastos fijos', icon: '📌' },
  { label: 'Cotización dólar', icon: '💵' },
  { label: 'Ahorros', icon: '🏦' },
  { label: 'Reportes', icon: '📊' }
];

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
          <button key={item.label} className={`menu-item ${index === 0 ? 'activo' : ''}`} type="button" title={item.label}>
            {collapsed ? item.icon : `${item.icon} ${item.label}`}
          </button>
        ))}
      </nav>
    </aside>
  );
}
