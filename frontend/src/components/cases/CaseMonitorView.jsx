// CaseMonitorView.jsx
// Vista de monitoreo de casos para el coordinador

import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCases } from "../../hooks/useCases";
import { useIncidents } from "../../hooks/useIncidents";
import { CASE_INITIAL_FILTERS } from "../../data/mockCases";
import { formatFecha } from "../../utils/dateUtils";
import { EstadoCasoBadge, GravedadCasoBadge } from "./CaseBadges";
import { CaseFilters } from "./CaseFilters";
import { StatCard } from "../shared/StatCards";
import { LoadingState, ErrorState } from "../shared/LodingAndError";

export function CaseMonitorView() {
  const navigate = useNavigate();
  const { cases, loading, error, reload } = useCases();
  const { incidents } = useIncidents();
  const [filters, setFilters] = useState(CASE_INITIAL_FILTERS);
  const [rol, setRol] = useState(null);

  // solo el coordinador puede crear casos
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/auth/users/me/", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRol(data.tipo_usuario); })
      .catch(() => {});
  }, []);


  // Filtros, los abiertos van primero
  const filtered = useMemo(() => {
    return cases.filter(c => {
      const q = filters.search.toLowerCase();
      const matchSearch = !q ||
        c.id.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q) ||
        c.estudiantes.some(e => e.nombre.toLowerCase().includes(q));
      const matchEstado   = filters.estado   === "todos" || c.estado   === filters.estado;
      const matchGravedad = filters.gravedad === "todas" || c.gravedad === filters.gravedad;
      const matchCurso    = filters.curso    === "todos" || c.estudiantes.some(e => e.nombre_curso === filters.curso);
      return matchSearch && matchEstado && matchGravedad && matchCurso;
    }).sort((a, b) => {
      const orden = { "abierto": 0, "cerrado": 1 };
      return (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9);
    });
  }, [cases, filters]);

  // métricas para las stats de resumen
  const stats = useMemo(() => ({
    total:   cases.length,
    abierto: cases.filter(c => c.estado === "abierto").length,
    cerrado: cases.filter(c => c.estado === "cerrado").length,
  }), [cases]);

  if (loading) return <LoadingState mensaje="Cargando casos…" />;
  if (error)   return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col gap-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 font-serif">Monitoreo de Casos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Colegio San Penquista</p>
        </div>
        <div className="flex gap-3">
          {rol === "coordinador" && (
            <Link to="/cases/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 transition-colors">
              ＋ Nuevo caso
            </Link>
          )}
          <button onClick={reload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-blue-200 text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-colors">
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total"      value={stats.total}     color="text-blue-700" bg="bg-blue-50" border="border-blue-200" />
        <StatCard label="Abiertos"   value={stats.abierto}   color="text-blue-700" bg="bg-blue-50" border="border-blue-200" />
        <StatCard label="Cerrados"   value={stats.cerrado}   color="text-blue-700" bg="bg-blue-50" border="border-blue-200" />
      </div>
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 items-center">
          <input type="text" placeholder="Buscar por ID, descripción o estudiante…"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white shadow-sm"
          />
          <CaseFilters filters={filters} onChange={setFilters} />
        </div>
        <p className="text-xs text-gray-500">
          Mostrando <strong>{filtered.length}</strong> de <strong>{cases.length}</strong> casos
        </p>
      </div>

      {/* Tabla de casos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-semibold">No se encontraron casos con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-900 text-white text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Inicio</th>
                  <th className="px-4 py-3 text-left">Estudiantes</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-left">Gravedad</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Hitos</th>
                  <th className="px-4 py-3 text-left">Incidentes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map(c => (
                  // clickear el caso te lleva al detalle del mismo
                  <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)} className="hover:bg-blue-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-bold text-blue-700">{c.id}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatFecha(c.fechaInicio)}</td>
                    <td className="px-4 py-3">

                      {/*Muestra hasta 2 estudiantes, primero va siempre el autor/agresor */}
                      {[...c.estudiantes].sort((a,b) =>
                        a.rol === "autor_agresor" ? -1 : b.rol === "autor_agresor" ? 1 : 0
                      ).slice(0,2).map((e,i) => (
                        <div key={i} className="text-gray-800 font-medium text-xs">{e.nombre} <span className="text-gray-500">({e.nombre_curso})</span></div>
                      ))}
                      {c.estudiantes.length > 2 && <div className="text-xs text-gray-500">+{c.estudiantes.length - 2} más</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <span className="line-clamp-2 text-sm">{c.descripcion}</span>
                    </td>
                    {/* muestra gravedad,estado,hitos y incidentes */}
                    <td className="px-4 py-3"><GravedadCasoBadge gravedad={c.gravedad} /></td> 
                    <td className="px-4 py-3"><EstadoCasoBadge estado={c.estado} /></td>
                    <td className="px-4 py-3 text-xs">{c.hitos.length} hito{c.hitos.length !== 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 text-xs">{incidents
                      .filter(i => i._id_caso === c._id_caso)
                      .filter((i, idx, arr) => arr.findIndex(o =>
                        o.fecha === i.fecha && o.descripcion === i.descripcion && o.gravedad === i.gravedad && o.categoria === i.categoria
                      ) === idx)
                      .length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}