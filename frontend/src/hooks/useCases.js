import { useState, useEffect, useCallback } from "react";
import { MOCK_CASES } from "../data/mockCases";
import { mensajeDeError } from "../utils/ApiErrors";

const USE_MOCK = false;

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
    estudiantes: (c.estudiantes ?? []).map(e => ({
      ...e.estudiante, 
      rol: e.rol ?? "Sin rol" 
    })),
    hitos:       [...(c.hitos ?? [])].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
  };
}

const fetchFromAPI = async (token) => {
  const res = await fetch("/api/operate/cases/read", {
    headers: {
      "Content-Type": "application/json",
      // Inyectamos el token directamente en la cabecera
      "Authorization": `Bearer ${token}` 
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(mensajeDeError(err.detail, res.status));
  }

  const data = await res.json();
  return data.map(mapCase);
};

// Función base para llamar al PATCH de casos
async function patchCaso(idCaso, payload, token) {
  const res = await fetch(`/api/operate/cases/${idCaso}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }

  return res.json(); // retorna CasoResponse completo y fresco
}

const fetchMock = () =>
  new Promise((resolve) => setTimeout(() => resolve(MOCK_CASES.map(mapCase)), 600));

export function useCases() {
  const [cases, setCases]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Leemos el token de forma síncrona desde el almacenamiento local
      const token = localStorage.getItem("access_token");
      
      // Medida de seguridad extra por si el Guard falla
      if (!USE_MOCK && !token) {
        throw new Error("No se encontró un token de sesión.");
      }

      const data = USE_MOCK ? await fetchMock() : await fetchFromAPI(token);
      setCases(data);
    } catch (e) {
      setError(e.message || "No se pudo cargar los casos. Intenta nuevamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateLocal = useCallback((id, changes) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }, []);

  const handleCambiarEstado = useCallback(async (id, nuevoEstado) => {
    const c = cases.find(x => x.id === id);
    const estadoPrevio = c?.estado;

    // 1. Optimistic UI Update (Cambiamos la vista antes de confirmar en el backend)
    updateLocal(id, { estado: nuevoEstado });

    if (!USE_MOCK) {
      const token = localStorage.getItem("access_token");

      try {
        const res = await fetch(`/api/operate/cases/${c?._id_caso}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        });

        if (!res.ok) throw new Error("Error en la respuesta del servidor");
      } catch (e) {
        console.error("Error al cambiar estado:", e);
        // Si el servidor falla, revertimos el Optimistic Update al estado anterior
        if (estadoPrevio !== undefined) updateLocal(id, { estado: estadoPrevio });
        throw e; // dejamos que la vista sepa que falló
      }
    }
  }, [cases, updateLocal]);

  const handleEditarCaso = useCallback(async (id, editForm) => {
    const c = cases.find(x => x.id === id);
    if (!c) return;

    const token = localStorage.getItem("access_token");
    const body = {
      desc:         editForm.descripcion   || undefined,
      estado:       editForm.estado        || undefined,
      gravedad:     editForm.gravedad      || undefined,
      fecha_cierre: editForm.fecha_cierre  || null,
    };

      const actualizado = await patchCaso(c._id_caso, body, token);

    updateLocal(id, {
      descripcion: actualizado.desc,
      estado:      actualizado.estado,
      gravedad:    actualizado.gravedad,
      fechaCierre: actualizado.fecha_cierre ?? null,
    });
  }, [cases, updateLocal]);

// Elimina un hito del caso y actualiza el estado local con la respuesta del backend
  const handleEliminarHito = useCallback(async (id, idHito) => {
    const c = cases.find(x => x.id === id);
    if (!c) return;

    const token = localStorage.getItem("access_token");
    const actualizado = await patchCaso(c._id_caso, { hitos_a_eliminar: [idHito] }, token);

    // Reemplazamos los hitos con los que devuelve el backend (ya sin el eliminado)
    updateLocal(id, {
      hitos: [...(actualizado.hitos ?? [])].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
    });
  }, [cases, updateLocal]);

  // Desvincula un incidente del caso (queda pendiente, no se borra)
  const handleDesvincularIncidente = useCallback(async (id, idIncidente) => {
    const c = cases.find(x => x.id === id);
    if (!c) return;

    const token = localStorage.getItem("access_token");
    await patchCaso(c._id_caso, { incidentes_a_eliminar: [idIncidente] }, token);

    // CasoResponse no incluye incidentes, así que solo recargamos si es necesario.
    // Si tu vista de caso muestra incidentes, llama a reload() aquí en vez de updateLocal.
  }, [cases]);


  return { cases, loading, error, reload: load, handleCambiarEstado, handleEditarCaso, handleEliminarHito, handleDesvincularIncidente };
}