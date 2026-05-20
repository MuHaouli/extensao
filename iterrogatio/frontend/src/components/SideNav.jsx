import { useCallback, useState } from "react";
import { useLocation, useNavigate, matchPath } from "react-router-dom";
import { SIDE_NAV_ITEMS } from "../navigation/sideNavConfig";

function navItemIsActive(pathname, itemPath) {
  return !!matchPath({ path: itemPath, end: true }, pathname);
}

export function SideNav({ onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className={`side-nav${collapsed ? " side-nav--collapsed" : ""}`}>
      <button
        type="button"
        className="nav-logo"
        onClick={() => navigate("/menu")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer"
        }}
      >
        🎙️ <p className="nav-logo-text">Interrogatio</p>
      </button>
      <button
        type="button"
        className="side-nav-toggle"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-controls="side-nav-main"
        title={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <span className="side-nav-toggle-icon" aria-hidden>
          {collapsed ? "▶" : "◀"}
        </span>
      
      </button>
      <nav
        id="side-nav-main"
        className="nav-items"
        aria-label="Navegação principal"
      >
        {SIDE_NAV_ITEMS.map((item) => {
          const active = navItemIsActive(pathname, item.path);
          const className = active ? "nav-item active" : "nav-item";

          return (
            <button
              key={item.id}
              type="button"
              className={className}
              onClick={() => navigate(item.path)}
              title={item.label}
              aria-current={active ? "page" : undefined}
            >
              {item.icon != null && item.icon !== "" && (
                <span className="nav-item-icon">{item.icon}</span>
              )}
              <span className="nav-item-label">{item.label}</span>
              <span className="nav-item-abbrev">{item.abbrev}</span>
            </button>
          );
        })}
      </nav>
      {onLogout && (
        <button type="button" className="nav-item logout-button" onClick={onLogout}>
          <span className="nav-item-icon">🚪</span>
          <span className="nav-item-label">Sair</span>
        </button>
      )}
    </div>
  );
}
