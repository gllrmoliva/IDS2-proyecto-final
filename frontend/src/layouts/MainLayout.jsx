// MainLayout.jsx
// Estructura visual compartida por todas las vistas del coordinador.
// Incluye una barra de navegación superior con acceso a incidentes y casos.

import { Outlet, NavLink } from "react-router-dom";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-100">

      {/* Barra de navegación */}
      <nav style={{
        background: "#1e3a7a",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        height: "56px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
      }}>
        {/* Nombre del sistema */}
        <span style={{
          color: "white", fontWeight: "800", fontSize: "16px",
          letterSpacing: "0.05em", marginRight: "24px"
        }}>
          Panoptes
        </span>

        {/* Links de navegación */}
        <NavLink to="/incidents" style={({ isActive }) => ({
          color: isActive ? "white" : "rgba(255,255,255,0.6)",
          fontWeight: isActive ? "700" : "500",
          fontSize: "14px",
          padding: "6px 14px",
          borderRadius: "8px",
          background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
          textDecoration: "none",
          transition: "all 0.15s",
        })}>
          Incidentes
        </NavLink>

        <NavLink to="/cases" style={({ isActive }) => ({
          color: isActive ? "white" : "rgba(255,255,255,0.6)",
          fontWeight: isActive ? "700" : "500",
          fontSize: "14px",
          padding: "6px 14px",
          borderRadius: "8px",
          background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
          textDecoration: "none",
          transition: "all 0.15s",
        })}>
          Casos
        </NavLink>

        {/* Botón cerrar sesión (AUN NO FUNCIONA) */}
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => alert("Cerrar sesión no está implementado aún.")}
            style={{
              color: "rgba(255,255,255,0.7)",
              fontWeight: "500",
              fontSize: "14px",
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.25)",
              background: "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Contenido de la página activa */}
      <Outlet />
    </div>
  );
}