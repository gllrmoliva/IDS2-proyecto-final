// IncidentDetailModal.jsx
import { useState, useMemo } from "react";
import { GravedadBadge, EstadoBadge } from "./IncidentBadges";
import { formatFecha } from "../../utils/dateUtils";
import { Section, DataRow, FormGroup } from "../shared/UIHelpers";


const MOCK_CASOS = [
  { id: "CASO-001", alumno: "Valentina Rojas Soto", curso: "3°A", tipo: "Conducta agresiva reiterada" },
  { id: "CASO-002", alumno: "Sebastián Muñoz Torres", curso: "2°B", tipo: "Daño a infraestructura" },
  { id: "CASO-003", alumno: "Diego Herrera Lagos", curso: "1°C", tipo: "Acoso escolar (bullying)" },
];

function CasoBuscador() {
  const [query, setQuery] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [abierto, setAbierto] = useState(false);

  // Filtra por ID o nombre de alumno
  const resultados = useMemo(() => {
    if (!query.trim()) return MOCK_CASOS;
    const q = query.toLowerCase();
    return MOCK_CASOS.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.alumno.toLowerCase().includes(q) ||
      c.curso.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSeleccionar = (caso) => {
    setSeleccionado(caso);
    setQuery(caso.id);
    setAbierto(false);
  };

  const handleLimpiar = () => {
    setSeleccionado(null);
    setQuery("");
    setAbierto(true);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        Caso al que pertenece
      </label>

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Buscar por ID (ej: CASO-001), alumno o curso…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAbierto(true); setSeleccionado(null); }}
            onFocus={() => setAbierto(true)}
            className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm"
          />
          {seleccionado && (
            <button
              onClick={handleLimpiar}
              className="text-gray-400 hover:text-gray-600 text-lg flex-shrink-0"
              title="Cambiar caso"
            >✕</button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {abierto && !seleccionado && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 60 }}
              onClick={() => setAbierto(false)}
            />
            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 70,
              background: "white",
              border: "2px solid #bfdbfe",
              borderRadius: "12px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              maxHeight: "200px",
              overflowY: "auto",
            }}>
              {resultados.length === 0 ? (
                <div style={{ padding: "16px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>
                  No se encontraron casos
                </div>
              ) : (
                resultados.map((caso) => (
                  <div
                    key={caso.id}
                    onClick={() => handleSeleccionar(caso)}
                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f0f2f7" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e3a7a" }}>{caso.id}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{caso.alumno} · {caso.curso} · {caso.tipo}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Caso seleccionado confirmado */}
      {seleccionado && (
        <div style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "13px",
          marginTop: "4px",
        }}>
          <span style={{ fontWeight: "700", color: "#1e3a7a" }}>{seleccionado.id}</span>
          {" — "}{seleccionado.alumno} · {seleccionado.curso}
        </div>
      )}
    </div>
  );
}



export function IncidentDetailModal({ incident, onClose, onAprobar, onRechazar, onRevertir }) {
  if (!incident) return null;

  const [paso, setPaso] = useState("detalle");

  const isPendiente = incident.estado === "pendiente";

  const handleAprobarClick = () => {
    onAprobar(incident.id);
    setPaso("destino");
  };

  const handleCerrarSinGuardar = () => {
    onRevertir(incident.id);
    onClose();
  };

  const handleRechazarClick = () => {
    onRechazar(incident.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col">

        {/* Paso 1: Detalle */}
        {paso === "detalle" && (
          <>
            <ModalHeader incident={incident} onClose={onClose} />
            <div className="overflow-y-auto p-6 flex flex-col gap-5">
              <div className="flex gap-3 flex-wrap">
                <EstadoBadge estado={incident.estado} />
                <GravedadBadge gravedad={incident.gravedad} />
              </div>
              <Section title="👤 Alumno">
                <DataRow label="Nombre" value={incident.alumno.nombre} />
                <DataRow label="Curso"  value={incident.alumno.curso} />
                <DataRow label="RUT"    value={incident.alumno.rut} />
              </Section>
              <Section title="📝 Descripción">
                <p className="text-sm text-gray-600 leading-relaxed">{incident.descripcion}</p>
              </Section>
              {incident.involucrados?.length > 0 && (
                <Section title="👥 Involucrados">
                  <ul className="flex flex-col gap-2">
                    {incident.involucrados.map((inv, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {inv.nombre.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-800">{inv.nombre}</span>
                        <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{inv.rol}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              <Section title="ℹ️ Información del reporte">
                <DataRow label="Fecha"         value={formatFecha(incident.fecha)} />
                <DataRow label="Reportado por" value={`${incident.reportadoPor} (${incident.rolReportante})`} />
                <DataRow label="Evidencia"     value={incident.evidencia ?? "Sin evidencia adjunta"} />
              </Section>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              {isPendiente ? (
                <>
                  <button onClick={handleRechazarClick}
                    className="px-5 py-2.5 rounded-xl border-2 border-red-600 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">
                    ✗ Rechazar
                  </button>
                  <button onClick={handleAprobarClick}
                    className="px-5 py-2.5 rounded-xl bg-green-700 text-white font-bold text-sm hover:bg-green-800 transition-colors shadow">
                    ✅ Aprobar incidente
                  </button>
                </>
              ) : (
                <button onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                  Cerrar
                </button>
              )}
            </div>
          </>
        )}

        {/* Paso 2: Elegir destino */}
        {paso === "destino" && (
          <>
            <div className="flex items-center justify-between p-6 border-b-2 border-yellow-500">
              <div>
                <p className="text-xs font-bold text-green-700 tracking-widest uppercase mb-1">✅ Incidente aprobado</p>
                <h2 className="text-xl font-bold text-blue-900">¿Qué deseas crear?</h2>
              </div>
              <button onClick={handleCerrarSinGuardar}
                className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors"
                title="Cerrar — el incidente volverá a pendiente">
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-gray-500">El incidente <strong>{incident.id}</strong> fue aprobado. Ahora puedes registrarlo como un caso nuevo o como un hito dentro de un caso existente.</p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button onClick={() => setPaso("nuevo-caso")}
                  style={{ border: "2px solid #bfdbfe", borderRadius: "14px", padding: "24px 16px", background: "#eff6ff", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                  onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}
                >
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>📁</div>
                  <div style={{ fontWeight: "700", color: "#1e3a7a", fontSize: "15px", marginBottom: "4px" }}>Nuevo caso</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>Abre un caso nuevo con este incidente como punto de partida</div>
                </button>
                <button onClick={() => setPaso("nuevo-hito")}
                  style={{ border: "2px solid #bfdbfe", borderRadius: "14px", padding: "24px 16px", background: "#eff6ff", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                  onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}
                >
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>📌</div>
                  <div style={{ fontWeight: "700", color: "#1e3a7a", fontSize: "15px", marginBottom: "4px" }}>Hito en caso existente</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>Agrega este incidente como hito dentro de un caso ya abierto</div>
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400 italic">Si cierras, el incidente volverá a pendiente.</p>
              <button onClick={handleCerrarSinGuardar}
                className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
            </div>
          </>
        )}

        {/* Paso 3a: Formulario nuevo caso */}
        {paso === "nuevo-caso" && (
          <>
            <div className="flex items-center justify-between p-6 border-b-2 border-yellow-500">
              <div>
                <button onClick={() => setPaso("destino")} className="text-xs text-blue-600 font-bold mb-1 hover:underline">← Volver</button>
                <h2 className="text-xl font-bold text-blue-900">📁 Nuevo caso</h2>
              </div>
              <button onClick={handleCerrarSinGuardar}
                className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex flex-col gap-4">
              <div style={{ background: "#fdf3d0", border: "1px solid #C8960C", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#8a6308" }}>
                Datos pre-cargados desde el incidente. Revisa y completa antes de guardar.
              </div>
              <FormGroup label="Alumno involucrado">
                <input type="text" defaultValue={incident.alumno.nombre} readOnly
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-600" />
              </FormGroup>
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Fecha de apertura">
                  <input type="date" defaultValue={incident.fecha}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm" />
                </FormGroup>
                <FormGroup label="Curso">
                  <input type="text" defaultValue={incident.alumno.curso} readOnly
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-600" />
                </FormGroup>
              </div>
              <FormGroup label="Título del caso">
                <input type="text" defaultValue={incident.tipo}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm" />
              </FormGroup>
              <FormGroup label="Descripción inicial">
                <textarea defaultValue={incident.descripcion} rows={3}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm resize-none" />
              </FormGroup>
              <FormGroup label="Observaciones adicionales">
                <textarea placeholder="Agrega contexto adicional si es necesario…" rows={2}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm resize-none" />
              </FormGroup>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={handleCerrarSinGuardar}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => { alert("Caso creado exitosamente.\n(Aquí se conectará al backend.)"); onClose(); }}
                className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition-colors">
                📁 Crear caso
              </button>
            </div>
          </>
        )}

        {/* Paso 3b: Formulario nuevo hito */}
        {paso === "nuevo-hito" && (
          <>
            <div className="flex items-center justify-between p-6 border-b-2 border-yellow-500">
              <div>
                <button onClick={() => setPaso("destino")} className="text-xs text-blue-600 font-bold mb-1 hover:underline">← Volver</button>
                <h2 className="text-xl font-bold text-blue-900">📌 Nuevo hito</h2>
              </div>
              <button onClick={handleCerrarSinGuardar}
                className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex flex-col gap-4">
              <div style={{ background: "#fdf3d0", border: "1px solid #C8960C", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#8a6308" }}>
                Datos pre-cargados desde el incidente. Selecciona el caso y revisa antes de guardar.
              </div>
              <CasoBuscador />
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Tipo de hito">
                  <select className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm">
                    <option>Nuevo incidente</option>
                    <option>Entrevista apoderado</option>
                    <option>Derivación externa</option>
                    <option>Medida disciplinaria</option>
                    <option>Plan reparatorio</option>
                    <option>Otro</option>
                  </select>
                </FormGroup>
                <FormGroup label="Fecha">
                  <input type="date" defaultValue={incident.fecha}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm" />
                </FormGroup>
              </div>
              <FormGroup label="Descripción del hito">
                <textarea defaultValue={incident.descripcion} rows={3}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm resize-none" />
              </FormGroup>
              <FormGroup label="Evidencia (archivo)">
                <input type="file" className="w-full text-sm text-gray-500" />
              </FormGroup>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={handleCerrarSinGuardar}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => { alert("Hito agregado exitosamente.\n(Aquí se conectará al backend.)"); onClose(); }}
                className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition-colors">
                Guardar hito
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

function ModalHeader({ incident, onClose }) {
  return (
    <div className="flex items-start justify-between p-6 border-b-2 border-yellow-500">
      <div>
        <p className="text-xs font-bold text-blue-900 tracking-widest uppercase mb-1">{incident.id}</p>
        <h2 className="text-xl font-bold text-blue-900">{incident.tipo}</h2>
      </div>
      <button onClick={onClose}
        className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors">
        ✕
      </button>
    </div>
  );
}