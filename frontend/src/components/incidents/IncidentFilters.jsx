// IncidentFilters.jsx
import { useState, useEffect } from "react";
import { FILTER_OPTIONS, INITIAL_FILTERS } from "../../data/mockIncidents";

const GRAVEDADES_FILTER = [
  { value: "todas",     label: "Todas" },
  { value: "leve",      label: "Baja" },
  { value: "grave",     label: "Media" },
  { value: "muy_grave", label: "Alta" },
];

const PERIODOS = [
  { value: "todos",  label: "Cualquier fecha" },
  { value: "hoy",    label: "Hoy" },
  { value: "7d",     label: "Últimos 7 días" },
  { value: "30d",    label: "Últimos 30 días" },
  { value: "90d",    label: "Últimos 90 días" },
  { value: "custom", label: "Rango personalizado…" },
];

export function IncidentFilters({ filters, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [cursos, setCursos] = useState(["todos"]);

  useEffect(() => {
    const token = sessionStorage.getItem("panoptes_token");
    fetch("/api/students/courses/get_all", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCursos(["todos", ...data.map(c => c.nombre_curso)]))
      .catch(() => {});
  }, []);

  const handleDraft = (key) => (e) => {
    const update = { ...draft, [key]: e.target.value };
    if (key === "periodo" && e.target.value !== "custom") {
      update.fechaDesde = "";
      update.fechaHasta = "";
    }
    if (key === "fechaDesde" || key === "fechaHasta") {
      update.periodo = "custom";
    }
    setDraft(update);
  };

  const handleFiltrar = () => {
    onChange({ ...draft, search: filters.search });
    setOpen(false);
  };

  const handleLimpiar = () => {
    const reset = { ...INITIAL_FILTERS, search: filters.search };
    setDraft(reset);
    onChange(reset);
    setOpen(false);
  };

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === "search") return false;
    if (k === "fechaDesde" || k === "fechaHasta") return v !== "";
    return v !== INITIAL_FILTERS[k];
  }).length;

  return (
    <>
      {/* Botón */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors whitespace-nowrap
          ${open
            ? "bg-blue-900 text-white border-blue-900"
            : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50"
          }`}
      >
         Filtros
        {activeCount > 0 && (
          <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${open ? "bg-white text-blue-900" : "bg-blue-900 text-white"}`}>
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Overlay  */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
          />

          {/* Panel flotante */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "80px",
              right: "24px",
              zIndex: 50,
              width: "480px",
              backgroundColor: "white",
              border: "2px solid #bfdbfe",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Header del panel */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0", paddingBottom: "12px" }}>
              <span className="font-bold text-blue-900 text-sm uppercase tracking-wide">Filtros</span>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm transition-colors"
              >✕</button>
            </div>

            {/* Selectores */}
            <div className="flex flex-wrap gap-4 items-end">
              <FilterSelect label="Estado"   value={draft.estado}   onChange={handleDraft("estado")}   options={FILTER_OPTIONS.estados} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Gravedad</label>
                <select value={draft.gravedad} onChange={handleDraft("gravedad")}
                  className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white min-w-32">
                  {GRAVEDADES_FILTER.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <FilterSelect label="Curso"    value={draft.curso}    onChange={handleDraft("curso")}    options={cursos} />
            </div>

            {/* Fecha */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">📅 Período</label>
                <select
                  value={draft.periodo}
                  onChange={handleDraft("periodo")}
                  className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white min-w-48"
                >
                  {PERIODOS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              {draft.periodo === "custom" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Desde</label>
                    <input type="date" value={draft.fechaDesde} onChange={handleDraft("fechaDesde")}
                      className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Hasta</label>
                    <input type="date" value={draft.fechaHasta} onChange={handleDraft("fechaHasta")}
                      className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white" />
                  </div>
                </>
              )}
            </div>

            {/* Botones */}
            <div style={{ display: "flex", gap: "12px", borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
              <button
                onClick={handleFiltrar}
                className="px-6 py-2.5 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors"
              >
                Filtrar
              </button>
              <button
                onClick={handleLimpiar}
                className="px-6 py-2.5 border-2 border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
              >
               Limpiar filtros
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white capitalize min-w-32"
      >
        {options.map((o) => (
          <option key={o} value={o} className="capitalize">{o}</option>
        ))}
      </select>
    </div>
  );
}