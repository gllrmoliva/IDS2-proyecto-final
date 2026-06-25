// src/hooks/useIncidents.js
import { useState, useEffect, useCallback } from "react";
import { MOCK_INCIDENTS } from "../data/mockIncidents";
import { mensajeDeError } from "../utils/ApiErrors";

const USE_MOCK = false;

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
  const primerEstudiante = inc.estudiantes?.[0]?.estudiante;
  
  return {
    id:            `INC-${String(inc.id_incidente).padStart(3, "0")}`,
    _id_incidente: inc.id_incidente,
    _id_caso:      inc.id_caso ?? null,
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
    documentos:    (inc.documentos ?? []).map(d => ({ id_doc: d.id_doc, nombre: d.nombre_original })),
    alumno: {
      nombre: primerEstudiante?.nombre ?? "Sin estudiante",
      curso:  primerEstudiante?.nombre_curso ?? "—",
      rut:    primerEstudiante?.id_estudiante ?? "—",
    },
    involucrados: (inc.estudiantes ?? []).map(e => ({
      rut: e.estudiante.id_estudiante,
      nombre: e.estudiante.nombre,
      rol:    e.rol ?? "Estudiante", 
    })),
  };
}

// LECTURA DE INCIDENTES
const fetchFromAPI = async (token) => {
  const res = await fetch("/api/operate/incidents/read", {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(mensajeDeError(err.detail, res.status));
  }
  const data = await res.json();
  return data.map(mapIncident);
};

// PATCH PARA CAMBIAR ESTADO
async function patchIncidentEstado(idIncidente, estado, motivoRechazo = null, token) {
  const res = await fetch(`/api/operate/incidents/${idIncidente}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      estado: mapEstadoFrontToBackend(estado),
      motivo_rechazo: motivoRechazo,
    }),
  });
  if (!res.ok) throw new Error(`Error ${res.status} al actualizar incidente`);
  return res.json();
}

// POST PARA ELEVAR INCIDENTE
async function postElevarIncidente(idIncidente, payload, token) {
  const res = await fetch(`/api/operate/incidents/${idIncidente}/elevar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status} al elevar incidente`);
  }
  return res.json();
}

const fetchMock = () =>
  new Promise((resolve) => setTimeout(() => resolve(MOCK_INCIDENTS), 600));

export function useIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      
      if (!USE_MOCK && !token) {
        throw new Error("No se encontró un token de sesión.");
      }

      const data = USE_MOCK ? await fetchMock() : await fetchFromAPI(token);
      setIncidents(data);
    } catch (e) {
      setError(e.message || "No se pudo cargar los incidentes. Intenta nuevamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const token = localStorage.getItem("access_token");
      try { 
        await patchIncidentEstado(inc._id_incidente, "aprobado", null, token); 
      } catch (e) { 
        console.error("Error al aprobar:", e); 
        updateLocal(id, { estado: inc.estado }); 
      }
    }
  }, [incidents, updateLocal]);

  const handleRechazar = useCallback(async (id, razon) => {
    const inc = incidents.find(i => i.id === id);
    updateLocal(id, { estado: "rechazado", razonRechazo: razon });
    if (!USE_MOCK && inc?._id_incidente) {
      const token = localStorage.getItem("access_token");
      try { 
        await patchIncidentEstado(inc._id_incidente, "rechazado", razon, token); 
      } catch (e) { 
        console.error("Error al rechazar:", e); 
        updateLocal(id, { estado: inc.estado, razonRechazo: inc.razonRechazo }); 
      }
    }
  }, [incidents, updateLocal]);

  const handleRevertir = useCallback(async (id) => {
    const inc = incidents.find(i => i.id === id);
    updateLocal(id, { estado: "pendiente", razonRechazo: null });
    if (!USE_MOCK && inc?._id_incidente) {
      const token = localStorage.getItem("access_token");
      try { 
        await patchIncidentEstado(inc._id_incidente, "pendiente", null, token); 
      } catch (e) { 
        console.error("Error al revertir:", e); 
        updateLocal(id, { estado: inc.estado, razonRechazo: inc.razonRechazo });
      }
    }
  }, [incidents, updateLocal]);

  const handleElevar = useCallback(async (id, payload) => {
    const inc = incidents.find(i => i.id === id);
    if (!USE_MOCK && inc?._id_incidente) {
      const token = localStorage.getItem("access_token");
      await postElevarIncidente(inc._id_incidente, payload, token);
    }
  }, [incidents]);

  return { 
    incidents, 
    loading, 
    error, 
    reload: load, 
    updateLocal, 
    handleAprobar, 
    handleRechazar, 
    handleRevertir,
    handleElevar 
  };
}