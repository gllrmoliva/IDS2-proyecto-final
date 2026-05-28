// useIncidents.js
// Hook que abstrae el origen de datos de incidentes.
// Para activar el backend: cambiar USE_MOCK a false.

import { useState, useEffect, useCallback } from "react";
import { MOCK_INCIDENTS } from "../data/mockIncidents";

const USE_MOCK = true;

// Mapeo de estados 
function mapEstadoBackendToFront(estado) {
  if (estado === "aceptado") return "aprobado";
  return estado;
}
function mapEstadoFrontToBackend(estado) {
  if (estado === "aprobado") return "aceptado";
  return estado;
}

// Mapeador
function mapIncident(inc) {
  const primerEstudiante = inc.estudiantes?.[0];
  return {
    id:            `INC-${String(inc.id_incidente).padStart(3, "0")}`,
    _id_incidente: inc.id_incidente,
    fecha:         inc.fecha,
    tipo:          inc.desc?.split(".")[0] ?? "Incidente",
    descripcion:   inc.desc,
    gravedad:      inc.gravedad ?? "baja",
    estado:        mapEstadoBackendToFront(inc.estado),
    razonRechazo:  inc.motivo_rechazo ?? null,
    reportadoPor:  inc.productor?.nombre ?? "—",
    rolReportante: inc.productor?.tipo_usuario ?? "—",
    evidencia:     inc.documentos?.[0]?.nombre_original ?? null,
    alumno: {
      nombre: primerEstudiante?.nombre ?? "Sin estudiante",
      curso:  primerEstudiante?.nombre_curso ?? "—",
      rut:    primerEstudiante?.id_estudiante ?? "—",
    },
    involucrados: (inc.estudiantes ?? []).map(e => ({
      nombre: e.nombre,
      rol:    "Estudiante",
    })),
  };
}



const fetchFromAPI = async (token) => {
  const res = await fetch("/api/operate/incidents/read", {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Error ${res.status}: no se pudo cargar los incidentes`);
  const data = await res.json();
  return data.map(mapIncident);
};

// PATCH para cambiar estado
async function patchIncidentEstado(idIncidente, estado, motivoRechazo = null, token) {
  const res = await fetch(`/api/operate/incidents/${idIncidente}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      estado: mapEstadoFrontToBackend(estado),
      motivo_rechazo: motivoRechazo,
    }),
  });
  if (!res.ok) throw new Error(`Error ${res.status} al actualizar incidente`);
  return res.json();
}

const fetchMock = () =>
  new Promise((resolve) => setTimeout(() => resolve(MOCK_INCIDENTS), 600));


export function useIncidents(token = null) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = USE_MOCK ? await fetchMock() : await fetchFromAPI(token);
      setIncidents(data);
    } catch (e) {
      setError("No se pudo cargar los incidentes. Intenta nuevamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const updateLocal = useCallback((id, changes) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, ...changes } : inc))
    );
  }, []);

  const handleAprobar = useCallback(async (id) => {
    const inc = incidents.find(i => i.id === id);
    updateLocal(id, { estado: "aprobado" });
    if (!USE_MOCK && inc?._id_incidente) {
      try { await patchIncidentEstado(inc._id_incidente, "aprobado", null, token); }
      catch (e) { console.error("Error al aprobar:", e); updateLocal(id, { estado: "pendiente" }); }
    }
  }, [incidents, updateLocal, token]);

  const handleRechazar = useCallback(async (id, razon) => {
    const inc = incidents.find(i => i.id === id);
    updateLocal(id, { estado: "rechazado", razonRechazo: razon });
    if (!USE_MOCK && inc?._id_incidente) {
      try { await patchIncidentEstado(inc._id_incidente, "rechazado", razon, token); }
      catch (e) { console.error("Error al rechazar:", e); updateLocal(id, { estado: "pendiente", razonRechazo: null }); }
    }
  }, [incidents, updateLocal, token]);

  const handleRevertir = useCallback(async (id) => {
    const inc = incidents.find(i => i.id === id);
    updateLocal(id, { estado: "pendiente", razonRechazo: null });
    if (!USE_MOCK && inc?._id_incidente) {
      try { await patchIncidentEstado(inc._id_incidente, "pendiente", null, token); }
      catch (e) { console.error("Error al revertir:", e); }
    }
  }, [incidents, updateLocal, token]);

  return { incidents, loading, error, reload: load, updateLocal, handleAprobar, handleRechazar, handleRevertir };
}