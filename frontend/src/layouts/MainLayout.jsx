// src/layouts/MainLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export function MainLayout() {
  const [identidad, setIdentidad] = useState("Cargando usuario...");
  const [rol, setRol] = useState(null);
  const navigate = useNavigate();

  // 1. Decodificar el token para mostrar el usuario y pedir el rol
  useEffect(() => {
    try {
      // Usamos localStorage y la llave correcta "access_token"
      const token = localStorage.getItem("access_token");
      if (token) {
        // El JWT tiene 3 partes separadas por puntos. El payload es la segunda [1].
        const payload = JSON.parse(atob(token.split(".")[1]));

        // Dependiendo de cómo armaste tu payload en FastAPI,
        // asumiremos que el correo está en 'sub'.
        setIdentidad(payload.sub);

        // el token no trae el rol, así que lo pedimos aparte
        fetch("/api/auth/users/me/", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => { if (data) setRol(data.tipo_usuario); })
          .catch(() => {});
      }
    } catch (e) {
      console.warn("No se pudo decodificar el token para el layout", e);
      setIdentidad("Usuario Desconocido");
    }
  }, []);

  // los productores no pueden ver casos ni estudiantes (el backend les da 403)
  const puedeVerCasos = rol === "coordinador" || rol === "profesor_jefe";
  const puedeVerEstudiantes = rol === "coordinador" || rol === "profesor_jefe";

  // 2. Función de Logout
  const handleLogout = () => {
    // Borrar el token del navegador
    localStorage.removeItem("access_token");
    
    // Redirigir inmediatamente al login
    navigate("/login", { replace: true });
  };

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

        {puedeVerCasos && (
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
        )}

        {puedeVerEstudiantes && (
          <NavLink to="/students" style={({ isActive }) => ({
            color: isActive ? "white" : "rgba(255,255,255,0.6)",
            fontWeight: isActive ? "700" : "500",
            fontSize: "14px",
            padding: "6px 14px",
            borderRadius: "8px",
            background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
            textDecoration: "none",
            transition: "all 0.15s",
          })}>
            Estudiantes
          </NavLink>
        )}

        {/* Contenedor Flex para Identidad + Botón */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
          
          {/* Identificador de Rol/Usuario */}
          <span style={{ 
            color: "rgba(255,255,255,0.85)", 
            fontSize: "13px", 
            fontWeight: "500" 
          }}>
            {identidad}
          </span>

          <button
            onClick={handleLogout}
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