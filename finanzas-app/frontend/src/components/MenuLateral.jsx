const items = [
  { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { key: 'movimientos', label: 'Movimientos', icon: '💸' },
  { key: 'gastos_fijos', label: 'Valores fijos', icon: '📌' },
  { key: 'cotizacion', label: 'Cotización dólar', icon: '💵' },
  { key: 'ahorros', label: 'Ahorros', icon: '🏦' },
  { key: 'reportes', label: 'Reportes', icon: '📊' }
];

export default function MenuLateral({ collapsed, onToggle, active, onSelect }) {
  return (
    <aside className={`menu-shell ${collapsed ? 'collapsed' : ''}`}>
      <div className="menu-top">
        <h3>{collapsed ? '☰' : 'Menú'}</h3>
        <button type="button" className="toggle-menu" onClick={onToggle}>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav>
        {items.map((item) => (
          <button
            key={item.key}
            className={`menu-item ${active === item.key ? 'activo' : ''}`}
            type="button"
            title={item.label}
            onClick={() => onSelect(item.key)}
          >
            {collapsed ? item.icon : `${item.icon} ${item.label}`}
          </button>
        ))}
      </nav>
    </aside>
  );
}
