// useIncidents.js
// Hook que abstrae el origen de datos de incidentes.
// HOY: devuelve datos mock.
// CUANDO EL BACKEND ESTÉ LISTO: reemplaza la función fetchIncidents por fetch() real.

import { useState, useEffect, useCallback } from "react";
import { MOCK_INCIDENTS } from "../data/mockIncidents";

// ─── Simulación de llamada a API ─────────────────────────────────────────────
// Reemplaza esta función con tu fetch real, por ejemplo:
//   const res = await fetch("/api/incidents", { headers: { Authorization: `Bearer ${token}` } });
//   return res.json();
const fetchIncidents = () =>
  new Promise((resolve) => setTimeout(() => resolve(MOCK_INCIDENTS), 600));

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch (e) {
      setError("No se pudo cargar los incidentes. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // updateLocal: actualiza el estado local optimistamente.
  // Cuando conectes el backend, haz el PATCH/PUT aquí y luego llama load() para sincronizar.
  const updateLocal = useCallback((id, changes) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, ...changes } : inc))
    );
  }, []);

  return { incidents, loading, error, reload: load, updateLocal };
}