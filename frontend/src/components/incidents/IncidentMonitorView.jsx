// Vista Principal del Monitor de Incidentes 
// (God have mercy on me ;-;)
// IncidentMonitorView.jsx, contienne:
//   - Resumen de stats (total, pendientes, aprobados, rechazados)
//   - Barra de filtros
//   - Tabla de incidentes 
//   - Modal de detalle con acciones aprobar/rechazar

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useIncidents } from "../../hooks/useIncidents";
import { IncidentFilters } from "./IncidentFilters";
import { INITIAL_FILTERS } from "../../data/mockIncidents";
import { IncidentTable } from "./IncidentTable";
import { IncidentDetailModal } from "./IncidentDetailModal";

// Devuelve la fecha límite inferior según el periodo elegido
function getFechaLimite(periodo) {
  if (periodo === "todos" || periodo === "custom") return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (periodo === "hoy") return hoy;
  const dias = { "7d": 7, "30d": 30, "90d": 90 }[periodo];
  const fecha = new Date(hoy);
  fecha.setDate(hoy.getDate() - dias);
  return fecha;
}

export function IncidentMonitorView() {
  const { incidents, loading, error, reload, updateLocal } = useIncidents();
  const [filters, setFilters]   = useState(INITIAL_FILTERS);
  const [selected, setSelected] = useState(null); 
  
  const filtered = useMemo(() => {
    const fechaLimite = getFechaLimite(filters.periodo);
    const desde = filters.periodo === "custom" && filters.fechaDesde
      ? new Date(filters.fechaDesde + "T00:00:00")
      : null;
    const hasta = filters.periodo === "custom" && filters.fechaHasta
      ? new Date(filters.fechaHasta + "T23:59:59")
      : null;

    return incidents.filter((inc) => {
      const q = filters.search.toLowerCase();
      const matchSearch =
        !q ||
        inc.alumno.nombre.toLowerCase().includes(q) ||
        inc.tipo.toLowerCase().includes(q) ||
        inc.reportadoPor.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q);

      const matchEstado   = filters.estado   === "todos" || inc.estado        === filters.estado;
      const matchGravedad = filters.gravedad === "todas" || inc.gravedad      === filters.gravedad;
      const matchCurso    = filters.curso    === "todos" || inc.alumno.curso  === filters.curso;

      // Filtro de fecha
      const fechaInc = new Date(inc.fecha + "T00:00:00");
      const matchFecha =
        (!fechaLimite && !desde)        ? true          // sin filtro
        : fechaLimite                   ? fechaInc >= fechaLimite   // periodo rápido
        : (desde && hasta)              ? fechaInc >= desde && fechaInc <= hasta
        : desde                         ? fechaInc >= desde
        : hasta                         ? fechaInc <= hasta
        : true;

      return matchSearch && matchEstado && matchGravedad && matchCurso && matchFecha;
    });
  }, [incidents, filters]);

  
  const stats = useMemo(() => ({
    total:     incidents.length,
    pendiente: incidents.filter(i => i.estado === "pendiente").length,
    aprobado:  incidents.filter(i => i.estado === "aprobado").length,
    rechazado: incidents.filter(i => i.estado === "rechazado").length,
  }), [incidents]);

 
  const handleAprobar  = (id) => updateLocal(id, { estado: "aprobado" });
  const handleRechazar = (id) => updateLocal(id, { estado: "rechazado" });
  const handleRevertir = (id) => updateLocal(id, { estado: "pendiente" }); // revierte si cierra sin guardar

  // Estados de carga y error
  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col gap-6">

      {  /* Header + botón de recarga */ }
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 font-serif">
            Monitoreo de Incidentes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Vista de coordinador — Colegio San Penquista</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/report"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 transition-colors"
          >
            ＋ Nuevo incidente
          </Link>
          <button
            onClick={reload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-blue-200 text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total"     value={stats.total}     color="text-blue-700"  bg="bg-blue-50"   border="border-blue-200" />
        <StatCard label="Pendientes" value={stats.pendiente} color="text-blue-700" bg="bg-blue-50" border="border-blue-200" />
        <StatCard label="Aprobados"  value={stats.aprobado}  color="text-blue-700" bg="bg-blue-50"  border="border-blue-200" />
        <StatCard label="Rechazados" value={stats.rechazado} color="text-blue-700"   bg="bg-blue-50"   border="border-blue-200" />
      </div>

      {/* Búsqueda + filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Buscar por alumno, tipo, reportante…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white shadow-sm"
          />
          <IncidentFilters filters={filters} onChange={setFilters} />
        </div>
        <p className="text-xs text-gray-400">
          Mostrando <strong>{filtered.length}</strong> de <strong>{incidents.length}</strong> incidentes
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <IncidentTable incidents={filtered} onSelect={setSelected} />
      </div>

      {/* Modal de detalle */}
      {selected && (
        <IncidentDetailModal
          incident={selected}
          onClose={() => setSelected(null)}
          onAprobar={handleAprobar}
          onRechazar={handleRechazar}
          onRevertir={handleRevertir}
        />
      )}
    </div>
  );
}

// Componentes auxiliares

function StatCard({ label, value, color, bg, border }) {
  return (
    <div className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
      <div className={`text-4xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1 font-semibold">{label}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <div className="text-5xl mb-4 animate-spin">⏳</div>
        <p className="font-semibold">Cargando incidentes…</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center bg-white rounded-2xl p-8 shadow border border-red-100 max-w-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="font-semibold text-red-700 mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}