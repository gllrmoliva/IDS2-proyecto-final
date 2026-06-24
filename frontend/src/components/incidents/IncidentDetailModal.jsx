// IncidentDetailModal.jsx
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCases } from "../../hooks/useCases";

const LABEL_CATEGORIA = {
  violencia_fisica: "Violencia física",
  violencia_psicologica_acoso: "Violencia psicológica / Acoso",
  disrupcion_desacato: "Disrupción / Desacato",
  probidad_fraude: "Probidad / Fraude",
  dano_infraestructura_bienes: "Daño a infraestructura o bienes",
  conductas_riesgo_sustancias: "Conductas de riesgo / Sustancias",
  privacidad_tecnologia: "Privacidad / Tecnología",
  sexualidad_obscenidad: "Sexualidad / Obscenidad",
  valores_institucionales: "Valores institucionales",
  otro: "Otro",
};
const LABEL_ROL = {
  autor_agresor: "Autor / Agresor",
  afectado_victima: "Afectado / Víctima",
  complice: "Cómplice",
  testigo_espectador: "Testigo / Espectador",
};
const labelCategoria = (v) => LABEL_CATEGORIA[v] ?? (v ? v.replace(/_/g, " ") : "—");
const labelRol       = (v) => LABEL_ROL[v]       ?? (v ? v.replace(/_/g, " ") : "Sin rol");
import { GravedadBadge, EstadoBadge } from "./IncidentBadges";
import { formatFecha } from "../../utils/dateUtils";
import { Section, DataRow, FormGroup } from "../shared/UIHelpers";

// CasoBuscador
// Usa useCases para obtener casos reales (o mock si USE_MOCK=true en useCases.js).
// Filtra por casos abiertos donde participa alguno de los involucrados del incidente.

function CasoBuscador({ involucrados = [], onSeleccionar }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const { cases } = useCases();

  // Filtrar casos abiertos donde participa alguno de los involucrados
  const nombresInvolucrados = involucrados.map(i => i.nombre.toLowerCase());
  const casosRelevantes = cases.filter(c =>
    c.estado === "abierto" &&
    c.estudiantes?.some(e =>
      nombresInvolucrados.some(nombre =>
        e.nombre?.toLowerCase().includes(nombre.split(" ")[0].toLowerCase())
      )
    )
  );

  return (
    <div className="flex flex-col gap-3">
      {casosRelevantes.length === 0 ? (
        <div style={{
          background: "#f9fafb", border: "1px solid #e5e7eb",
          borderRadius: "10px", padding: "20px", textAlign: "center",
          color: "#9ca3af", fontSize: "13px"
        }}>
          No se encontraron casos activos para los involucrados de este incidente.
        </div>
      ) : (
        casosRelevantes.map((caso) => {
          const estaSeleccionado = seleccionado?.id === caso.id;
          return (
            <div key={caso.id}
              onClick={() => {
                const nuevo = estaSeleccionado ? null : caso;
                setSeleccionado(nuevo);
                onSeleccionar?.(nuevo);
              }}
              style={{
                border: estaSeleccionado ? "2px solid #1e3a7a" : "2px solid #e5e7eb",
                borderRadius: "12px", padding: "14px 16px", cursor: "pointer",
                background: estaSeleccionado ? "#eff6ff" : "white",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!estaSeleccionado) e.currentTarget.style.borderColor = "#bfdbfe"; }}
              onMouseLeave={e => { if (!estaSeleccionado) e.currentTarget.style.borderColor = "#e5e7eb"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontWeight: "700", color: "#1e3a7a", fontSize: "13px" }}>{caso.id}</span>
                  <span style={{
                    marginLeft: "8px", fontSize: "11px", fontWeight: "600",
                    padding: "2px 8px", borderRadius: "99px",
                    background: "#dbeafe", color: "#1e40af",
                  }}>Abierto</span>
                </div>
                {estaSeleccionado && (
                  <span style={{ color: "#1e3a7a", fontWeight: "700", fontSize: "13px" }}>✓</span>
                )}
              </div>
              <div style={{ fontSize: "13px", color: "#374151", marginTop: "4px", fontWeight: "500" }}>
                {caso.estudiantes?.[0]?.nombre ?? "Sin estudiante"}
                {caso.estudiantes?.length > 1 && <span style={{ color: "#6b7280", fontSize: "12px" }}> +{caso.estudiantes.length - 1} más</span>}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                {caso.estudiantes?.[0]?.nombre_curso ?? "—"} · {caso.descripcion?.substring(0, 60)}{caso.descripcion?.length > 60 ? "…" : ""}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function EvidenciaLinks({ documentos }) {
  const [abriendo, setAbriendo] = useState(null);

  if (documentos.length === 0) {
    return <DataRow label="Evidencia" value="Sin evidencia adjunta" />;
  }

  const handleAbrir = async (id_doc) => {
    setAbriendo(id_doc);
    try {
      const token = localStorage.getItem("access_token");
      const r = await fetch(`/api/documents/documentos/${id_doc}/url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${r.status}`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      alert(`No se pudo cargar el archivo: ${e.message}`);
    } finally {
      setAbriendo(null);
    }
  };

  return (
    <div className="flex gap-2 py-1">
      <span className="text-xs font-semibold text-gray-500 w-28 flex-shrink-0">Evidencia</span>
      <div className="flex flex-col gap-1">
        {documentos.map(({ id_doc, nombre }) => (
          <button
            key={id_doc}
            type="button"
            onClick={() => handleAbrir(id_doc)}
            className="text-sm text-blue-600 hover:underline text-left"
          >
            {abriendo === id_doc ? "Cargando..." : nombre}
          </button>
        ))}
      </div>
    </div>
  );
}

export function IncidentDetailModal({ incident, onClose, onAprobar, onRechazar, onRevertir, onElevar }) {
  // El rol no viaja en el token (solo el email), así que lo pedimos al backend.
  // Se usa para decidir si mostramos el enlace al caso vinculado (solo coordinador).
  const [rol, setRol] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/auth/users/me/", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRol(data.tipo_usuario); })
      .catch(() => {});
  }, []);
  if (!incident) return null;

  const [paso, setPaso] = useState("detalle");
  const [showRechazarForm, setShowRechazarForm] = useState(false);
  const [razonRechazo, setRazonRechazo] = useState("");
  const [razonError, setRazonError] = useState(false);
  const [showConfirmDeshacer, setShowConfirmDeshacer] = useState(false);
  
  // Estados para elevación
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [elevarLoading, setElevarLoading] = useState(false);
  
  // Estados controlados para el formulario de nuevo caso
  const [fechaInicio, setFechaInicio] = useState(incident.fecha || "");
  const [descNueva, setDescNueva] = useState(incident.descripcion || "");
  const [observaciones, setObservaciones] = useState("");

  const isPendiente = incident.estado === "pendiente";

  const handleAprobarClick = () => {
    onAprobar(incident.id);
    setPaso("destino");
  };

  const handleRechazarClick = () => setShowRechazarForm(true);

  const handleConfirmarRechazo = () => {
    if (!razonRechazo.trim()) { setRazonError(true); return; }
    onRechazar(incident.id, razonRechazo);
    onClose();
  };

  const handleEditarDecision = () => setShowConfirmDeshacer(true);

  const handleConfirmarDeshacer = () => {
    setShowRechazarForm(false);
    setRazonRechazo("");
    setRazonError(false);
    setShowConfirmDeshacer(false);
    onRevertir(incident.id);
    onClose();
  };

  const handleCerrarSinGuardar = () => {
    onRevertir(incident.id);
    onClose();
  };

  // Funciones de submit
  const submitNuevoCaso = async () => {
    setElevarLoading(true);
    const payload = {
      tipo_elevacion: "nuevo_caso",
      nuevo_caso: {
        fecha_inicio: fechaInicio,
        desc: observaciones.trim() ? `${descNueva}\n\nObservaciones: ${observaciones}` : descNueva,
        gravedad: incident.gravedad,
        categoria: incident.categoria || "otro",
      }
    };
    try {
      await onElevar(incident.id, payload);
      onClose();
    } catch (e) {
      alert("Error al elevar: " + e.message);
    } finally {
      setElevarLoading(false);
    }
  };

  const submitReincidencia = async () => {
    if (!casoSeleccionado) return;
    setElevarLoading(true);
    const payload = {
      tipo_elevacion: "acumulacion",
      id_caso_acumulado: casoSeleccionado._id_caso
    };
    try {
      await onElevar(incident.id, payload);
      onClose();
    } catch (e) {
      alert("Error al anexar: " + e.message);
    } finally {
      setElevarLoading(false);
    }
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
              <Section title="Alumno">
                <DataRow label="Nombre" value={incident.alumno.nombre} />
                <DataRow label="Curso"  value={incident.alumno.curso} />
                <DataRow label="RUT"    value={incident.alumno.rut} />
              </Section>
              <Section title="Descripción de lo ocurrido">
                <p className="text-sm text-gray-600 leading-relaxed">{incident.descripcion}</p>
              </Section>
              {incident.involucrados?.length > 0 && (
                <Section title="Involucrados">
                  <ul className="flex flex-col gap-2">
                    {[...incident.involucrados].sort((a,b) => a.rol === "autor_agresor" ? -1 : b.rol === "autor_agresor" ? 1 : 0).map((inv, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {inv.nombre.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-800">{inv.nombre}</span>
                        <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{labelRol(inv.rol)}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {/* Caso vinculado, solo para coordinador */}
              {rol === "coordinador" && incident._id_caso && (
                <Link
                  to={`/cases/CASO-${String(incident._id_caso).padStart(3, "0")}`}
                  onClick={onClose}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    border: "2px solid #1e3a7a",
                    background: "#eff4ff",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#dbe6ff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#eff4ff"; }}
                >
                  <div>
                    <p style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px 0" }}>
                      Caso vinculado
                    </p>
                    <p style={{ fontSize: "24px", fontWeight: "800", color: "#1e3a7a", margin: 0 }}>
                      {`CASO-${String(incident._id_caso).padStart(3, "0")}`}
                    </p>
                  </div>
                  <span style={{ fontSize: "18px", fontWeight: "700", color: "#1e3a7a", whiteSpace: "nowrap" }}>
                    Ver caso →
                  </span>
                </Link>
              )}
              <Section title="ℹInformación del reporte">
                <DataRow label="Fecha"         value={formatFecha(incident.fecha)} />
                <DataRow label="Reportado por" value={incident.reportadoPor} />
                <EvidenciaLinks documentos={incident.documentos ?? []} />
              </Section>
            </div>

            {/* Mini-modal centrado para motivo de rechazo */}
            {showRechazarForm && (
              <div style={{
                position: "fixed", inset: 0, zIndex: 60,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.4)"
              }}
                onClick={(e) => { if (e.target === e.currentTarget) { setShowRechazarForm(false); setRazonRechazo(""); setRazonError(false); } }}
              >
                <div style={{
                  background: "white", borderRadius: "16px", padding: "28px",
                  width: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                  border: "2px solid #fca5a5"
                }}>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#b91c1c", marginBottom: "6px" }}>
                    Motivo del rechazo
                  </h3>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
                    Explica por qué se rechaza el incidente <strong>{incident.id}</strong>. Este campo es obligatorio.
                  </p>
                  <textarea
                    value={razonRechazo}
                    onChange={(e) => { setRazonRechazo(e.target.value); setRazonError(false); }}
                    placeholder="Explica por qué se rechaza este incidente"
                    rows={4}
                    autoFocus
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: "10px", fontSize: "14px",
                      border: razonError ? "2px solid #ef4444" : "2px solid #fca5a5",
                      outline: "none", resize: "none", background: "white", boxSizing: "border-box"
                    }}
                  />
                  {razonError && (
                    <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px" }}>
                      Debes ingresar un motivo para rechazar el incidente.
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                    <button
                      onClick={() => { setShowRechazarForm(false); setRazonRechazo(""); setRazonError(false); }}
                      className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmarRechazo}
                      className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
                    >
                      Confirmar rechazo
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              {rol !== "coordinador" ? (
                /* Productores y profesores jefe solo pueden cerrar el detalle */
                <button onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                  Cerrar
                </button>
              ) : isPendiente ? (
                <>
                  {!showRechazarForm ? (
                    <>
                      <button onClick={handleRechazarClick}
                        className="px-5 py-2.5 rounded-xl border-2 border-red-600 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">
                        Rechazar
                      </button>
                      <button onClick={handleAprobarClick}
                        className="px-5 py-2.5 rounded-xl bg-green-700 text-white font-bold text-sm hover:bg-green-800 transition-colors shadow">
                        Aprobar incidente
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setShowRechazarForm(false); setRazonRechazo(""); setRazonError(false); }}
                        className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                      <button onClick={handleConfirmarRechazo}
                        className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors">
                        Confirmar rechazo
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  {!showConfirmDeshacer ? (
                    <>
                      <div style={{
                        background: incident.estado === "aprobado" ? "#f0fdf4" : "#fff5f5",
                        border: `1px solid ${incident.estado === "aprobado" ? "#86efac" : "#fca5a5"}`,
                        borderRadius: "10px", padding: "10px 14px", fontSize: "13px",
                        color: incident.estado === "aprobado" ? "#15803d" : "#b91c1c"
                      }}>
                        {incident.estado === "aprobado"
                          ? "Incidente aprobado."
                          : `Incidente rechazado ${incident.razonRechazo ?? "sin motivo registrado"}`
                        }
                      </div>
                      <div className="flex gap-3 justify-end">
                        {incident.estado === "rechazado" && (
                          <button onClick={handleEditarDecision}
                            className="px-5 py-2.5 rounded-xl border-2 border-gray-400 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                            Deshacer decisión
                          </button>
                        )}
                        <button onClick={onClose}
                          className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                          Cerrar
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ background: "#fff1f2", border: "2px solid #f87171", borderRadius: "12px", padding: "16px" }}>
                      <p style={{ fontSize: "15px", fontWeight: "700", color: "#b91c1c", marginBottom: "6px" }}>
                        ¿Estás segura/o de que deseas deshacer esta decisión?
                      </p>
                      <p style={{ fontSize: "13px", color: "#7f1d1d", marginBottom: "14px" }}>
                        El incidente volverá a estado pendiente y deberás tomar una nueva decisión. Esta acción no se puede deshacer.
                      </p>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={handleConfirmarDeshacer}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors">
                          Sí, deshacer decisión
                        </button>
                        <button onClick={() => setShowConfirmDeshacer(false)}
                          className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Paso 2: Elegir destino */}
        {paso === "destino" && (
          <>
            <div className="flex items-center justify-between p-6 border-b-2 border-yellow-500">
              <div>
                <p className="text-xs font-bold text-green-700 tracking-widest uppercase mb-1">Incidente aprobado</p>
                <h2 className="text-xl font-bold text-blue-900">¿Qué deseas crear?</h2>
              </div>
              <button onClick={handleCerrarSinGuardar}
                className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors"
                title="Cerrar — el incidente volverá a pendiente">✕</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-gray-500">El incidente <strong>{incident.id}</strong> fue aprobado. Ahora puedes elevarlo como un caso nuevo o agregarlo como reincidencia de un caso ya abierto.</p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button onClick={() => setPaso("nuevo-caso")}
                  style={{ border: "2px solid #bfdbfe", borderRadius: "14px", padding: "24px 16px", background: "#eff6ff", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                  onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}>
                  <svg style={{ width: "40px", height: "40px", margin: "0 auto 10px", display: "block", color: "#1e3a7a" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div style={{ fontWeight: "700", color: "#1e3a7a", fontSize: "15px", marginBottom: "4px" }}>Nuevo caso</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>Abre un caso nuevo con este incidente como punto de partida</div>
                </button>
                <button onClick={() => setPaso("reincidencia")}
                  style={{ border: "2px solid #bfdbfe", borderRadius: "14px", padding: "24px 16px", background: "#eff6ff", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                  onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}>
                  <svg style={{ width: "40px", height: "40px", margin: "0 auto 10px", display: "block", color: "#1e3a7a" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <div style={{ fontWeight: "700", color: "#1e3a7a", fontSize: "15px", marginBottom: "4px" }}>Reincidencia</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>Agrega este incidente dentro de un caso abierto</div>
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
                <h2 className="text-xl font-bold text-blue-900"> Nuevo caso</h2>
              </div>
              <button onClick={handleCerrarSinGuardar}
                className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto p-6 flex flex-col gap-4">
              <div style={{ background: "#fdf3d0", border: "1px solid #C8960C", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#8a6308" }}>
                Datos pre-cargados desde el incidente. Revisa y completa antes de guardar.
              </div>
              <FormGroup label="Alumno involucrado">
                <input type="text" value={incident.alumno.nombre} readOnly
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-600" />
              </FormGroup>
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Fecha de apertura">
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm" />
                </FormGroup>
                <FormGroup label="Curso">
                  <input type="text" value={incident.alumno.curso} readOnly
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-600" />
                </FormGroup>
              </div>
              
              <FormGroup label="Descripción inicial">
                <textarea value={descNueva} onChange={e => setDescNueva(e.target.value)} rows={3}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm resize-none" />
              </FormGroup>
              <FormGroup label="Observaciones adicionales">
                <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Agrega contexto adicional si es necesario…" rows={2}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm resize-none" />
              </FormGroup>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={handleCerrarSinGuardar} disabled={elevarLoading}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={submitNuevoCaso} disabled={elevarLoading}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-colors ${elevarLoading ? "bg-blue-400" : "bg-blue-900 hover:bg-blue-800"}`}>
                {elevarLoading ? "Creando..." : "Crear caso"}
              </button>
            </div>
          </>
        )}

        {/* Paso 3b: Formulario agregar incidente a caso existente */}
        {paso === "reincidencia" && (
          <>
            <div className="flex items-center justify-between p-6 border-b-2 border-yellow-500">
              <div>
                <button onClick={() => { setPaso("destino"); setCasoSeleccionado(null); }} className="text-xs text-blue-600 font-bold mb-1 hover:underline">← Volver</button>
                <h2 className="text-xl font-bold text-blue-900">Reincidencia en caso existente</h2>
              </div>
              <button onClick={handleCerrarSinGuardar}
                className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors">✕</button>
            </div>
            <div className="overflow-y-auto p-6 flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Selecciona el caso activo al que se anexará este incidente como reincidencia.
              </p>
              <CasoBuscador involucrados={incident.involucrados ?? []} onSeleccionar={setCasoSeleccionado} />
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={handleCerrarSinGuardar} disabled={elevarLoading}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                disabled={!casoSeleccionado || elevarLoading}
                onClick={submitReincidencia}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-colors ${
                  casoSeleccionado && !elevarLoading
                    ? "bg-blue-900 hover:bg-blue-800"
                    : "bg-blue-300 cursor-not-allowed"
                }`}>
                {elevarLoading ? "Agregando..." : "Agregar como reincidencia"}
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
        <h2 className="text-xl font-bold text-blue-900">{labelCategoria(incident.categoria ?? incident.tipo)}</h2>
      </div>
      <button onClick={onClose}
        className="ml-4 px-4 py-2 flex items-center justify-center rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
        Cerrar
      </button>
    </div>
  );
}