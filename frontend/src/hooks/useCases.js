// useCases.js
// Hook que abstrae el origen de datos de casos.
// Para activar el backend: cambiar USE_MOCK a false.

import { useState, useEffect, useCallback } from "react";
import { MOCK_CASES } from "../data/mockCases";

const USE_MOCK = true;

function mapCase(c) {
  return {
    id:          `CASO-${String(c.id_caso).padStart(3, "0")}`,
    _id_caso:    c.id_caso,
    estado:      c.estado,
    fechaInicio: c.fecha_inicio,
    fechaCierre: c.fecha_cierre ?? null,
    descripcion: c.desc,
    gravedad:    c.gravedad,
    estudiantes: c.estudiantes ?? [],
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

export function useCases(token = null) {
  const [cases, setCases]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = USE_MOCK ? await fetchMock() : await fetchFromAPI(token);
      setCases(data);
    } catch (e) {
      setError("No se pudo cargar los casos. Intenta nuevamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

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
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        });
      } catch (e) { console.error("Error al cambiar estado:", e); }
    }
  }, [cases, updateLocal, token]);

  return { cases, loading, error, reload: load, handleCambiarEstado };
}