// CaseDetailView.jsx con el link /cases/:id 
// id en id del caso: ejemplo = /cases/CASO-003
// la vista debería mostrar: info del caso (id, alumno principal, fechas, descrip, gravedad y estado),
// una "línea de tiempo" (no quedo tanto como una) con los eventos del caso ordenadas tal que lo más
// reciente se muestra primero,
// que los eventos se puedan cliquear y ver su detalle (falta implementar editar los hitos??)

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useCases } from "../../hooks/useCases";
import { useIncidents } from "../../hooks/useIncidents";
import { formatFecha } from "../../utils/dateUtils";
import { EstadoCasoBadge, GravedadCasoBadge } from "./CaseBadges";
import { GravedadBadge } from "../incidents/IncidentBadges";
import { LoadingState, ErrorState } from "../shared/LodingAndError";

// tablas de traspaso del enum a escritura "normal"
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

const LABEL_NIVEL = {
  cautelar: "Cautelar",
  formativa_n1: "Formativa (N1)",
  disciplinaria_n2: "Disciplinaria (N2)",
  excepcional_n3: "Excepcional (N3)",
};


const LABEL_CATEGORIA_TRAMITE = {
  comunicacion_citaciones: "Comunicación y citaciones",
  derivaciones:            "Derivaciones",
  documentacion:           "Documentación",
  coordinacion_interna:    "Coordinación interna",
};
const LABEL_SUBTIPO = {
  citacion_apoderado:               "Citación a apoderado",
  entrevista_estudiante:            "Entrevista con estudiante",
  entrevista_apoderado:             "Entrevista con apoderado",
  notificacion_formal:              "Notificación formal",
  derivacion_orientacion:           "Derivación a orientación",
  derivacion_psicologo:             "Derivación a psicólogo",
  derivacion_dupla_psicosocial:     "Derivación a dupla psicosocial",
  derivacion_red_externa:           "Derivación a red externa",
  firma_compromiso:                 "Firma de compromiso",
  acta_reunion:                     "Acta de reunión",
  registro_libro_clases:            "Registro en libro de clases",
  informe_seguimiento:              "Informe de seguimiento",
  reunion_equipo_directivo:         "Reunión de equipo directivo",
  comunicacion_inspector_general:   "Comunicación a inspector general",
  activacion_protocolo:             "Activación de protocolo",
};

const labelCategoriaTramite = (v) => LABEL_CATEGORIA_TRAMITE[v] ?? v;
const labelSubtipo          = (v) => LABEL_SUBTIPO[v] ?? (v ? v.replace(/_/g, " ") : null);
const labelCategoria = (v) => LABEL_CATEGORIA[v] ?? (v ? v.replace(/_/g, " ") : "—");
const labelRol       = (v) => LABEL_ROL[v]       ?? (v ? v.replace(/_/g, " ") : "Sin rol");
const labelNivel     = (v) => LABEL_NIVEL[v]      ?? v;

//Visor de documentos 
function DocLinks({ documentos }) {
  const [abriendo, setAbriendo] = useState(null);
  // mensaje para no documentos
  if (!documentos?.length) return (
    <p className="text-sm text-gray-400 italic">Sin documentos adjuntos.</p>
  );

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
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      alert(`No se pudo cargar el archivo: ${e.message}`);
    } finally {
      setAbriendo(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {documentos.map((doc) => (
        <button
          key={doc.id_doc}
          type="button"
          onClick={() => handleAbrir(doc.id_doc)}
          className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:underline text-left px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg transition-colors"
        > <span className="flex-1 truncate">{doc.nombre_original ?? doc.nombre ?? "Documento"}</span>
          {abriendo === doc.id_doc
            ? <span className="text-xs text-gray-400 flex-shrink-0">Cargando…</span>
            : <span className="text-xs text-gray-400 flex-shrink-0">Abrir →</span>
          }
        </button>
      ))}
    </div>
  );
}

// Modal de detalle
// muestra el detalle de un incidente o hito al hacer click sobre ellos. se diferencian por color hitos azules y
//incidentes burdeo
function EventoModal({ evento, onClose, onEliminarHito, onDesvincularIncidente, rol }) {
  if (!evento) return null;
  const esIncidente = evento._tipo_evento === "incidente";
// Estado local para la confirmación y el spinner de la acción destructiva
  const [confirmando, setConfirmando] = useState(false);
  const [ejecutando, setEjecutando]   = useState(false);

  const handleAccionDestructiva = async () => {
    setEjecutando(true);
    try {
      if (esIncidente) {
        await onDesvincularIncidente(evento._id_incidente);
      } else {
        await onEliminarHito(evento.id_hito);
      }
      onClose();
    } catch (e) {
      alert(`Error: ${e.message}`);
      setEjecutando(false);
      setConfirmando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/*encabezado con color según de que se trate */}
        <div className={`flex items-start justify-between p-6 border-b-2 ${
          esIncidente ? "border-red-800" : "border-blue-500"
        }`}>
          <div>
            {/* Etiqueta de si es trámite o medida */}
            <span className={`text-xs font-bold uppercase tracking-widest ${
              esIncidente ? "text-red-900" : "text-blue-700"
            }`}>
              {esIncidente ? "Incidente" : evento.tipo === "medida" ? "Medida" : "Trámite"}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              {esIncidente ? evento.id : formatFecha(evento.fecha)}
            </h2>
          </div>
          <button onClick={onClose}
            className="ml-4 px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          {esIncidente ? (
            <>
              <div className="flex gap-2 flex-wrap">
                <GravedadBadge gravedad={evento.gravedad} />
              </div>
              <InfoRow label="Fecha"         value={formatFecha(evento.fecha)} />
              <InfoRow label="Categoría"     value={labelCategoria(evento.categoria)} />
              <InfoRow label="Reportado por" value={evento.reportadoPor} />
              {evento.involucrados?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Involucrados</p>
                  <div className="flex flex-col gap-1">
                    {[...evento.involucrados]
                      .sort((a,b) => a.rol === "autor_agresor" ? -1 : b.rol === "autor_agresor" ? 1 : 0)
                      .map((inv, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm py-1 border-b border-gray-100 last:border-0">
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {inv.nombre?.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase()}
                          </span>
                          <span className="font-medium text-gray-800 flex-1">{inv.nombre}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{labelRol(inv.rol)}</span>
                        </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Descripción</p>
                <p className="text-sm text-gray-700 leading-relaxed">{evento.descripcion}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Documentos</p>
                <DocLinks documentos={evento.documentos} />
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                {evento.tipo === "medida"
                  ? `Medida ${labelNivel(evento.nivel_medida) ?? ""}`.trim()
                  : "Trámite"}
              </p>
              <InfoRow label="Fecha" value={formatFecha(evento.fecha)} />
              {evento.categoria_tramite && (
                <InfoRow label="Categoría" value={labelCategoriaTramite(evento.categoria_tramite)} />
              )}
              {evento.subtipo_tramite && (
                <InfoRow label="Tipo de trámite" value={labelSubtipo(evento.subtipo_tramite)} />
              )}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Descripción</p>
                <p className="text-sm text-gray-700 leading-relaxed">{evento.desc}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Involucrados</p>
                {evento.estudiantes?.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {evento.estudiantes.map((est, i) => (
                      <div key={est.id_estudiante ?? i} className="flex items-center gap-2 text-sm py-1 border-b border-gray-100 last:border-0">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {est.nombre?.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-800 flex-1">{est.nombre}</span>
                        <span className="text-xs text-gray-400">{est.nombre_curso}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin involucrados.</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Documentos</p>
                <DocLinks documentos={evento.documentos} />
              </div>
            </>
          )}
        </div>
        {/* ── Zona de acción destructiva ────────────────────────────────────
            Primero muestra el botón rojo. Al hacer click pide confirmación
            inline. Solo entonces el botón ejecuta la acción real.
            Solo el coordinador puede eliminar hitos o desvincular incidentes. */}
        {rol === "coordinador" && (
        <div className="p-5 border-t border-gray-100">
          {!confirmando ? (
            <button
              onClick={() => setConfirmando(true)}
              className={`w-full px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-colors ${
                esIncidente
                  ? "border-amber-600 text-amber-700 hover:bg-amber-50"
                  : "border-red-700 text-red-700 hover:bg-red-50"
              }`}
            >
              {esIncidente ? "Desvincular incidente del caso" : "Eliminar hito"}
            </button>
          ) : (
            <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 ${
              esIncidente ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"
            }`}>
              <p className="text-sm font-semibold text-gray-800">
                {esIncidente
                  ? "¿Desvincular este incidente? Quedará como pendiente y podrá reasignarse."
                  : "¿Eliminar este hito? Esta acción no se puede deshacer."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmando(false)}
                  disabled={ejecutando}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAccionDestructiva}
                  disabled={ejecutando}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-bold text-sm transition-colors ${
                    ejecutando
                      ? "bg-gray-400 cursor-not-allowed"
                      : esIncidente
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-red-700 hover:bg-red-800"
                  }`}
                >
                  {ejecutando ? "Procesando…" : "Confirmar"}
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

// componente para mostrar el par clave valor
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

// Vista principal
export function CaseDetailView() {
  const { id } = useParams(); // id
  const { cases, loading: loadingCases, error: errorCases, reload, handleEditarCaso, handleEliminarHito, handleDesvincularIncidente } = useCases(); // Datos del casp y sus hitos
  const { incidents, loading: loadingInc } = useIncidents();// Incidentes
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [rol, setRol] = useState(null);

  // editar caso y crear hito son solo del coordinador
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/auth/users/me/", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRol(data.tipo_usuario); })
      .catch(() => {});
  }, []);

  // Recargar al entrar para tener hitos y documentos actualizados
  useEffect(() => { reload(); }, []);

  // Generación de reporte PDF del caso.
  // Generación de reporte PDF del caso.
  // descargará el PDF renderizado
  const handleGenerarReporte = async () => {
    setGenerandoReporte(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/reports/case/${caso._id_caso}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`El servicio de reportes aún no está disponible (${res.status}).`);
      // Cuando el endpoint exista, descarga el blob:
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${caso.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`No se pudo generar el reporte: ${e.message}`);
    } finally {
      setGenerandoReporte(false);
    }
  };

  // Estado del modal de edición del caso
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [guardando, setGuardando] = useState(false);


  const caso = cases.find(c => c.id === id); //Busca el caso

  // filtrar incidentes que pertenecen a este caso y deduplicar por contenido
  const incidentesDelCaso = incidents
    .filter(inc => inc._id_caso === caso?._id_caso)
    .filter((inc, idx, arr) =>
      arr.findIndex(other =>
        other.fecha === inc.fecha &&
        other.descripcion === inc.descripcion &&
        other.gravedad === inc.gravedad &&
        other.categoria === inc.categoria
      ) === idx
    );

  // Involucrado principal: autor_agresor o el primero
  const alumno = caso?.estudiantes
    ? [...caso.estudiantes].sort((a,b) =>
        a.rol === "autor_agresor" ? -1 : b.rol === "autor_agresor" ? 1 : 0
      )[0]
    : null;

  // Inicializar form de edición con datos actuales del caso
  const initEditForm = () => setEditForm({
    descripcion:  caso?.descripcion  ?? "",
    estado:       caso?.estado       ?? "abierto",
    gravedad:     caso?.gravedad     ?? "leve",
    fecha_cierre: caso?.fechaCierre  ?? "",
  });

  // Hitos y incidentes ordenados por fecha descendente
  const eventosLineaDeTiempo = [
    ...(caso?.hitos ?? []).map(h => ({ ...h, _tipo_evento: "hito" })),
    ...incidentesDelCaso.map(i => ({ ...i, _tipo_evento: "incidente" })),
  ].sort((a, b) => new Date(b.fecha ?? 0) - new Date(a.fecha ?? 0));

  // Estados de carga y error de los hooks
  if (loadingCases || loadingInc) return <LoadingState mensaje="Cargando caso…" />;
  if (errorCases) return <ErrorState message={errorCases} onRetry={reload} />;

  // caaso no encontrado
  if (!caso) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center bg-white rounded-2xl p-8 shadow max-w-sm">
        <p className="font-semibold text-gray-700 mb-4">Caso no encontrado.</p>
        <Link to="/cases" className="px-4 py-2 rounded-xl border-2 border-blue-900 text-blue-900 font-semibold text-sm hover:bg-blue-50 transition-colors">Volver</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Barra superior con volver */}
      <div className="px-6 pt-6 pb-2">
        <Link to="/cases" className="px-4 py-2 rounded-xl border-2 border-blue-900 text-blue-900 font-semibold text-sm hover:bg-blue-50 transition-colors inline-block">Volver</Link>
      </div>
      <div className="flex gap-6 px-6 pb-6 items-start">

        {/* Columna izquierda: info del caso */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4 sticky top-6">

          {/* Tarjeta principal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 font-serif">{caso.id}</h1>
              {alumno && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">{alumno.nombre}</span>
                  <span className="text-gray-400"> · {alumno.nombre_curso}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <EstadoCasoBadge estado={caso.estado} />
              <GravedadCasoBadge gravedad={caso.gravedad} />
            </div>
            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
              <InfoRow label="Fecha de inicio" value={formatFecha(caso.fechaInicio)} />
              <InfoRow label="Fecha de cierre" value={caso.fechaCierre ? formatFecha(caso.fechaCierre) : "En curso"} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Descripción</p>
              <p className="text-sm text-gray-700 leading-relaxed">{caso.descripcion}</p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-2">
            {rol === "coordinador" && (
              <>
                <button
                  onClick={() => { initEditForm(); setEditando(true); }}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-900 text-blue-900 font-semibold text-sm hover:bg-blue-50 transition-colors text-center"
                >
                  Editar caso
                </button>
                <Link
                  to={`/cases/${id}/nuevo-hito`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 transition-colors text-center"
                >
                  ＋ Agregar hito
                </Link>
              </>
            )}
            {/* Boton de reporte — solo coordinador (el backend restringe /reports a coordinador) */}
            {rol === "coordinador" && (
              <button
                onClick={handleGenerarReporte}
                disabled={generandoReporte}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-colors text-center ${
                  generandoReporte
                    ? "border-gray-300 text-gray-400 cursor-not-allowed"
                    : "bg-[#a67c00] border-[#a67c00] text-white hover:bg-[#8a6800]"
                }`}
              >
                {generandoReporte ? "Generando…" : "Generar reporte"}
              </button>
            )}
          </div>

          {/* Involucrados solo nombres */}
          {caso.estudiantes?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Involucrados</p>
              <div className="flex flex-col gap-2">
                {caso.estudiantes.map((e, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {e.nombre?.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{e.nombre}</p>
                      <p className="text-xs text-gray-400">{e.nombre_curso}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/*  Columna derecha: línea de tiempo  */}
        <div className="flex-1 min-w-0">
          {/* Leyenda */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Línea de tiempo</h2>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-red-800 inline-block" /> Incidente
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-700 inline-block" /> Trámite / Medida
              </span>
            </div>
          </div>

          {eventosLineaDeTiempo.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center text-gray-400">
              <p className="font-semibold">No hay eventos registrados aún.</p>
              {rol === "coordinador" && (
                <Link to={`/cases/${id}/nuevo-hito`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                  Agregar el primer hito
                </Link>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="flex flex-col gap-5">
                {eventosLineaDeTiempo.map((evento, i) => {
                  const esIncidente = evento._tipo_evento === "incidente";
                  return (
                    <div
                      key={evento.id ?? evento.id_hito ?? i}
                      className="flex gap-4 items-center relative cursor-pointer group"
                      onClick={() => setEventoSeleccionado(evento)}
                    >
                      <div className={`w-14 h-14 rounded-full text-white text-lg font-bold flex items-center justify-center flex-shrink-0 z-10 shadow transition-transform group-hover:scale-110 ${
                        esIncidente ? "bg-red-800" : "bg-blue-700"
                      }`}>
                        {esIncidente ? "I" : evento.tipo === "medida" ? "M" : "T"}
                      </div>
                      <div className={`flex-1 rounded-xl p-4 border transition-all group-hover:shadow-md ${
                        esIncidente
                          ? "bg-red-50 border-red-800 group-hover:border-red-900"
                          : "bg-blue-50 border-blue-200 group-hover:border-blue-400"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {esIncidente ? (
                              <span className="text-xs font-bold text-red-900 uppercase tracking-wide">
                                Incidente · {evento.id}
                              </span>
                            ) : (
                              <span className="text-xs font-bold uppercase tracking-wide text-blue-800">
                                {evento.tipo === "medida"
                                  ? `Medida ${labelNivel(evento.nivel_medida) ?? ""}`.trim()
                                  : (labelSubtipo(evento.subtipo_tramite) ?? "Trámite")}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-600">{formatFecha(evento.fecha)}</span>
                        </div>
                        <p className="text-base text-gray-700 mt-1.5 line-clamp-2">
                          {esIncidente ? evento.descripcion : evento.desc}
                        </p>
                        <p className={`text-xs mt-2 font-bold ${esIncidente ? "text-red-900" : "text-blue-800"}`}>
                          Ver detalle →
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {eventoSeleccionado && (
        <EventoModal evento={eventoSeleccionado} onClose={() => setEventoSeleccionado(null)} rol={rol}
        onEliminarHito={async (idHito) => {
            await handleEliminarHito(caso.id, idHito);
            reload(); // refresca la línea de tiempo
          }}
          onDesvincularIncidente={async (idIncidente) => {
            await handleDesvincularIncidente(caso.id, idIncidente);
            reload(); // refresca incidentes
          }} />
      )}

      {/* Modal edición de caso */}
      {editando && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setEditando(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col">
            <div className="flex items-start justify-between p-6 border-b-2 border-blue-900">
              <h2 className="text-lg font-bold text-blue-900">Editar caso {caso.id}</h2>

            </div>
            <div className="p-6 flex flex-col gap-5">
              {/* Estado */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                <select
                  value={editForm.estado}
                  onChange={e => setEditForm(f => ({ ...f, estado: e.target.value, fecha_cierre: e.target.value === 'abierto' ? '' : f.fecha_cierre }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700"
                >
                  <option value="abierto">Abierto</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              {/* Fecha de cierre*/}
              {editForm.estado === "cerrado" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-2">
                  <label className="block text-sm font-semibold text-red-900">Fecha de cierre</label>
                  <p className="text-xs text-red-800">Confirma la fecha en que se cierra formalmente este caso. No puede ser anterior a la apertura ({formatFecha(caso.fechaInicio)}).</p>
                  <input
                    type="date"
                    required
                    min={caso.fechaInicio}
                    value={editForm.fecha_cierre}
                    onChange={e => setEditForm(f => ({ ...f, fecha_cierre: e.target.value }))}
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none transition text-gray-700 bg-white"
                  />
                </div>
              )}

              {/* Gravedad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Gravedad</label>
                <select
                  value={editForm.gravedad}
                  onChange={e => setEditForm(f => ({ ...f, gravedad: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700"
                >
                  <option value="leve">Leve</option>
                  <option value="grave">Grave</option>
                  <option value="muy_grave">Muy grave</option>
                </select>
              </div>
              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows="4"
                  value={editForm.descripcion}
                  onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditando(false)}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                disabled={guardando}
                onClick={async () => {
                  setGuardando(true);
                  await handleEditarCaso(caso.id, editForm);
                  setGuardando(false);
                  setEditando(false);
                  reload();
                }}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-colors ${guardando ? "bg-blue-400 cursor-not-allowed" : "bg-blue-900 hover:bg-blue-800"}`}>
                {guardando ? "Guardando" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}