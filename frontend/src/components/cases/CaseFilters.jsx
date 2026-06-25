// CaseFilters.jsx
// Panel de filtros para la vista de monitoreo de casos.
// Mismo patrón que IncidentFilters.jsx.

import { useState, useEffect } from "react";
import { CASE_FILTER_OPTIONS, CASE_INITIAL_FILTERS } from "../../data/mockCases";

const GRAVEDADES_FILTER = [
  { value: "todas",     label: "Todas" },
  { value: "leve",      label: "Leve" },
  { value: "grave",     label: "Grave" },
  { value: "muy_grave", label: "Muy grave" },
];

export function CaseFilters({ filters, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [cursos, setCursos] = useState(["todos"]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch("/api/students/courses/get_all", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCursos(["todos", ...data.map(c => c.nombre_curso)]))
      .catch(() => {});
  }, []);

  const handleDraft = (key) => (e) => setDraft({ ...draft, [key]: e.target.value });
  const handleFiltrar = () => { onChange({ ...draft, search: filters.search }); setOpen(false); };
  const handleLimpiar = () => {
    const r = { ...CASE_INITIAL_FILTERS, search: filters.search };
    setDraft(r); onChange(r); setOpen(false);
  };
  const activeCount = Object.entries(filters).filter(([k, v]) => k !== "search" && v !== CASE_INITIAL_FILTERS[k]).length;

  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors whitespace-nowrap
          ${open ? "bg-blue-900 text-white border-blue-900" : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50"}`}>
        Filtros
        {activeCount > 0 && (
          <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${open ? "bg-white text-blue-900" : "bg-blue-900 text-white"}`}>
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div onClick={e => e.stopPropagation()} style={{
            position: "fixed", top: "80px", right: "24px", zIndex: 50,
            width: "420px", backgroundColor: "white", border: "2px solid #bfdbfe",
            borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            padding: "20px", display: "flex", flexDirection: "column", gap: "20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0", paddingBottom: "12px" }}>
              <span className="font-bold text-blue-900 text-sm uppercase tracking-wide">Filtros</span>
              <button onClick={() => setOpen(false)} aria-label="Cerrar filtros" className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm">✕</button>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              {[["Estado", "estado", CASE_FILTER_OPTIONS.estados], ["Curso", "curso", cursos]].map(([label, key, opts]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</label>
                  <select value={draft[key]} onChange={handleDraft(key)}
                    className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white capitalize min-w-32">
                    {opts.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Gravedad</label>
                <select value={draft.gravedad} onChange={handleDraft("gravedad")}
                  className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white min-w-32">
                  {GRAVEDADES_FILTER.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
              <button onClick={handleFiltrar} className="px-6 py-2.5 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors">Filtrar</button>
              <button onClick={handleLimpiar} className="px-6 py-2.5 border-2 border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">Limpiar filtros</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}