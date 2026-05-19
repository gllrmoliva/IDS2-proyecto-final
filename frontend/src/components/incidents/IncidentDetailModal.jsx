// IncidentDetailModal.jsx
import { useState } from "react";
import { GravedadBadge, EstadoBadge } from "./IncidentBadges";
import { formatFecha } from "../../utils/dateUtils";
import { Section, DataRow, FormGroup } from "../shared/UIHelpers";


export function IncidentDetailModal({ incident, onClose, onAprobar, onRechazar, onRevertir }) {
  if (!incident) return null;

  const [paso, setPaso] = useState("detalle"); // "detalle" | "destino" | "nuevo-caso" | "nuevo-hito"

  const isPendiente = incident.estado === "pendiente";

  const handleAprobarClick = () => {
    onAprobar(incident.id);
    setPaso("destino");
  };

  // Si cierra en paso destino o formulario sin guardar, se revertirá a pendiente
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

        {/*  Detalle */}
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

        {/*  Elegir destino */}
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

        {/*  Formulario nuevo caso */}
        {paso === "nuevo-caso" && (
          <>
            <div className="flex items-center justify-between p-6 border-b-2 border-yellow-500">
              <div>
                <button onClick={() => setPaso("destino")} className="text-xs text-blue-600 font-bold mb-1 hover:underline">← Volver</button>
                <h2 className="text-xl font-bold text-blue-900">📁 Nuevo caso</h2>
              </div>
              <button onClick={onClose}
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
              <button onClick={() => setPaso("destino")}
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

        
        {/*  Formulario nuevo hito */}
        {paso === "nuevo-hito" && (
          <>
            <div className="flex items-center justify-between p-6 border-b-2 border-yellow-500">
              <div>
                <button onClick={() => setPaso("destino")} className="text-xs text-blue-600 font-bold mb-1 hover:underline">← Volver</button>
                <h2 className="text-xl font-bold text-blue-900">📌 Nuevo hito</h2>
              </div>
              <button onClick={onClose}
                className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex flex-col gap-4">
              <div style={{ background: "#fdf3d0", border: "1px solid #C8960C", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#8a6308" }}>
                 Datos pre-cargados desde el incidente. Selecciona el caso y revisa antes de guardar.
              </div>
              <FormGroup label="Caso al que pertenece">
                <select className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm">
                  <option value="">— Seleccionar caso existente —</option>
                  <option>Caso 001 Prueba</option>   
                  <option>Caso 002 Prueba</option>
                  <option>Caso 003 Prueba</option>
                </select>
              </FormGroup>
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
              <button onClick={() => setPaso("destino")}
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

// Componentes auxiliares para el modal

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

