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
      const token = sessionStorage.getItem("panoptes_token");
      const r = await fetch(`/api/documents/documentos/${id_doc}/url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error();
      // esto crea un url temporal en memoria
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // despues de 30s revocar la url para liberar memoria
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      alert("No se pudo cargar el archivo.");
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
function EventoModal({ evento, onClose }) {
  if (!evento) return null;
  const esIncidente = evento._tipo_evento === "incidente";

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
            Cancelar
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
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Documentos</p>
                <DocLinks documentos={evento.documentos} />
              </div>
            </>
          )}
        </div>
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
  const { cases, loading: loadingCases, error: errorCases, reload, handleEditarCaso } = useCases(); // Datos del casp y sus hitos
  const { incidents, loading: loadingInc } = useIncidents();// Incidentes
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  // Recargar al entrar para tener hitos y documentos actualizados
  useEffect(() => { reload(); }, []);

  // Estado del modal de edición del caso
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [guardando, setGuardando] = useState(false);


  const caso = cases.find(c => c.id === id); //Busca el caso

  // filtrar incidentes que pertenecen a este caso
  const incidentesDelCaso = incidents.filter(inc =>
    inc._id_caso === caso?._id_caso || inc._id_caso_acumulado === caso?._id_caso
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
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col gap-6">
      <div className="flex items-center">
        <Link to="/cases" className="px-4 py-2 rounded-xl border-2 border-blue-900 text-blue-900 font-semibold text-sm hover:bg-blue-50 transition-colors">Volver</Link>
      </div>
      {/* Tarjeta de información */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
      
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 font-serif">{caso.id}</h1>

            {/*alumno con su curso*/}
            {alumno && (
              <p className="text-base text-gray-600 mt-1">
                <span className="font-semibold">{alumno.nombre}</span>
                <span className="text-gray-600"> · {alumno.nombre_curso}</span>
              </p>
            )}
          </div>
          {/* Acciones del caso */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { initEditForm(); setEditando(true); }}
              className="px-4 py-2 rounded-xl border-2 border-blue-900 text-blue-900 font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              Editar caso
            </button>
            <Link
              to={`/cases/${id}/nuevo-hito`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 text-white font-semibold text-sm hover:bg-blue-800 transition-colors"
            >
              ＋ Agregar hito
            </Link>
          </div>
        </div>
        {/* Badges bajo el nombre */}
        <div className="flex gap-2 flex-wrap">
          <EstadoCasoBadge estado={caso.estado} />
          <GravedadCasoBadge gravedad={caso.gravedad} />
        </div>

        {/* Datos en grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 pt-2 border-t border-gray-100">
          <InfoRow label="Fecha de inicio" value={formatFecha(caso.fechaInicio)} />
          <InfoRow label="Fecha de cierre" value={caso.fechaCierre ? formatFecha(caso.fechaCierre) : "En curso"} />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Descripción</p>
          <p className="text-base text-gray-700 leading-relaxed">{caso.descripcion}</p>
        </div>
      </div>

      {/* Línea de tiempo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {/* leyenda de colores */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Línea de tiempo</h2>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-red-800 inline-block" /> Incidente
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-700 inline-block" /> Trámite / Medida
              </span>
            </div>
          </div>
        </div>

        {/*Lista de eventos */}
        {eventosLineaDeTiempo.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="font-semibold">No hay eventos registrados aún.</p>
            <Link to={`/cases/${id}/nuevo-hito`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Agregar el primer hito
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Línea vertical centrada en los puntos */}
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
                    {/* Circulo con la letra M: medida, T: trámite y I:incidente */}
                    <div className={`w-14 h-14 rounded-full text-white text-lg font-bold flex items-center justify-center flex-shrink-0 z-10 shadow transition-transform group-hover:scale-110 ${
                      esIncidente ? "bg-red-800" : "bg-blue-700"
                    }`}>
                      {esIncidente ? "I" : evento.tipo === "medida" ? "M" : "T"}
                    </div>

                    {/* Tarjeta */}
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
                            <>
                              <span className="text-xs font-bold uppercase tracking-wide text-blue-800">
                                {evento.tipo === "medida"
                                  ? `Medida ${labelNivel(evento.nivel_medida) ?? ""}`.trim()
                                  : (labelSubtipo(evento.subtipo_tramite) ?? "Trámite")}
                              </span>
                            </>
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

      {eventoSeleccionado && (
        <EventoModal evento={eventoSeleccionado} onClose={() => setEventoSeleccionado(null)} />
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
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-2">
                  <label className="block text-sm font-semibold text-amber-800">Fecha de cierre</label>
                  <p className="text-xs text-amber-700">Confirma la fecha en que se cierra formalmente este caso. No puede ser anterior a la apertura ({formatFecha(caso.fechaInicio)}).</p>
                  <input
                    type="date"
                    required
                    min={caso.fechaInicio}
                    value={editForm.fecha_cierre}
                    onChange={e => setEditForm(f => ({ ...f, fecha_cierre: e.target.value }))}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none transition text-gray-700 bg-white"
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