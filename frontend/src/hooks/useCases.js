// useCases.js
// Hook que abstrae el origen de datos de casos.
// Para activar el backend: cambiar USE_MOCK a false.

import { useState, useEffect, useCallback } from "react";
import { MOCK_CASES } from "../data/mockCases";

const USE_MOCK = false;

// --- HOTFIX: Auto-login para desarrollo ---
const fetchDevToken = async () => {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    // FastAPI requiere Form Data para el login, no JSON
    body: new URLSearchParams({
      //username: "carlos.insp@colegio.cl",
      //password: "testpassword1",
      username: "maria.prof@colegio.cl",
      password: "testpassword3",
    }),
  });
  if (!res.ok) throw new Error("Fallo el auto-login de desarrollo");
  const data = await res.json();
  return data.access_token;
};


// ------------------------------------------

function mapCase(c) {
  return {
    id:          `CASO-${String(c.id_caso).padStart(3, "0")}`,
    _id_caso:    c.id_caso,
    estado:      c.estado,
    fechaInicio: c.fecha_inicio,
    fechaCierre: c.fecha_cierre ?? null,
    descripcion: c.desc,
    gravedad:    c.gravedad,
    categoria:   c.categoria,
    // Desempaquetar el Association Object usando la nueva llave
    estudiantes: (c.estudiantes ?? []).map(e => ({
      ...e.estudiante, // Extrae id_estudiante, nombre, nombre_curso
      rol: e.rol ?? "Sin rol" // Conserva el rol investigativo
    })),
    hitos:       (c.hitos ?? []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
  };
}

const fetchFromAPI = async (token) => {
  const res = await fetch("/api/operate/cases/read", {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Error ${res.status}: no se pudo cargar los casos`);
  const data = await res.json();
  return data.map(mapCase);
};

const fetchMock = () =>
  new Promise((resolve) => setTimeout(() => resolve(MOCK_CASES.map(mapCase)), 600));

export function useCases(initialToken = null) {
  const [cases, setCases]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  
  // Guardamos el token en el estado para poder reusarlo en los PATCH
  const [activeToken, setActiveToken] = useState(initialToken);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let currentToken = activeToken;
      
      // Ejecutar hotfix si no hay token
      if (!USE_MOCK && !currentToken) {
        currentToken = await fetchDevToken();
        setActiveToken(currentToken);
        sessionStorage.setItem("panoptes_token", currentToken);
      }

      const data = USE_MOCK ? await fetchMock() : await fetchFromAPI(currentToken);
      setCases(data);
    } catch (e) {
      setError("No se pudo cargar los casos. Intenta nuevamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeToken]);

  useEffect(() => { load(); }, [load]);

  const updateLocal = useCallback((id, changes) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }, []);

  const handleCambiarEstado = useCallback(async (id, nuevoEstado) => {
    updateLocal(id, { estado: nuevoEstado });
    if (!USE_MOCK) {
      const c = cases.find(x => x.id === id);
      try {
        await fetch(`/api/operate/cases/${c?._id_caso}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        });
      } catch (e) { 
        console.error("Error al cambiar estado:", e); 
        // Opcional: Revertir el estado local si falla la red
      }
    }
  }, [cases, updateLocal, activeToken]);

  return { cases, loading, error, reload: load, handleCambiarEstado };
}
