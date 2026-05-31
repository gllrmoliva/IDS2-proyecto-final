// useIncidents.js
import { useState, useEffect, useCallback } from "react";
import { MOCK_INCIDENTS } from "../data/mockIncidents";

const USE_MOCK = false;

//  HOTFIX: Auto-login para desarrollo 
const fetchDevToken = async () => {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    // FastAPI requiere Form Data para el login, no JSON
    body: new URLSearchParams({
      // username: "ana.silva@colegio.cl",
      // password: "testpassword",
      username: "carlos.insp@colegio.cl",
      password: "testpassword1",
      //username: "maria.prof@colegio.cl",
      //password: "testpassword3",
    }),
  });
  if (!res.ok) throw new Error("Fallo el auto-login de desarrollo");
  const data = await res.json();
  return data.access_token;
};


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
  // Navegar al primer estudiante real a través de la nueva llave
  const primerEstudiante = inc.estudiantes?.[0]?.estudiante;
  
  return {
    id:            `INC-${String(inc.id_incidente).padStart(3, "0")}`,
    _id_incidente: inc.id_incidente,
    fecha:         inc.fecha,
    tipo:          inc.categoria ?? (inc.desc?.split(".")[0] ?? "Incidente"),
    categoria:     inc.categoria ?? null,
    descripcion:   inc.desc,
    gravedad:      inc.gravedad ?? "baja",
    estado:        mapEstadoBackendToFront(inc.estado),
    razonRechazo:  inc.motivo_rechazo ?? null,
    reportadoPor:  inc.productor?.nombre?.replace(/\s*\(.*?\)\s*$/, "").trim() ?? "—",
    rolReportante: inc.productor?.tipo_usuario ?? "—",
    evidencia:     inc.documentos?.[0]?.nombre_original ?? null,
    alumno: {
      nombre: primerEstudiante?.nombre ?? "Sin estudiante",
      curso:  primerEstudiante?.nombre_curso ?? "—",
      rut:    primerEstudiante?.id_estudiante ?? "—",
    },
    involucrados: (inc.estudiantes ?? []).map(e => ({
      nombre: e.estudiante.nombre,
      rol:    e.rol ?? "Estudiante", // Extrae el rol real desde la base de datos
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

export function useIncidents(initialToken = null) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  
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
        setActiveToken(currentToken); // Guardar para uso futuro
        sessionStorage.setItem("panoptes_token", currentToken);
      }

      const data = USE_MOCK ? await fetchMock() : await fetchFromAPI(currentToken);
      setIncidents(data);
    } catch (e) {
      setError("No se pudo cargar los incidentes. Intenta nuevamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeToken]);

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
      try { await patchIncidentEstado(inc._id_incidente, "aprobado", null, activeToken); }
      catch (e) { console.error("Error al aprobar:", e); updateLocal(id, { estado: "pendiente" }); }
    }
  }, [incidents, updateLocal, activeToken]);

  const handleRechazar = useCallback(async (id, razon) => {
    const inc = incidents.find(i => i.id === id);
    updateLocal(id, { estado: "rechazado", razonRechazo: razon });
    if (!USE_MOCK && inc?._id_incidente) {
      try { await patchIncidentEstado(inc._id_incidente, "rechazado", razon, activeToken); }
      catch (e) { console.error("Error al rechazar:", e); updateLocal(id, { estado: "pendiente", razonRechazo: null }); }
    }
  }, [incidents, updateLocal, activeToken]);

  const handleRevertir = useCallback(async (id) => {
    const inc = incidents.find(i => i.id === id);
    updateLocal(id, { estado: "pendiente", razonRechazo: null });
    if (!USE_MOCK && inc?._id_incidente) {
      try { await patchIncidentEstado(inc._id_incidente, "pendiente", null, activeToken); }
      catch (e) { console.error("Error al revertir:", e); }
    }
  }, [incidents, updateLocal, activeToken]);

  return { incidents, loading, error, reload: load, updateLocal, handleAprobar, handleRechazar, handleRevertir };
}
