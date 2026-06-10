// FormularioHito.jsx

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { BuscadorEstudiante } from "../shared/StudentSearch";

//medidas, quizá se podría agregar algo más específico (???)
const NIVEL_MEDIDA = [
  { value: "cautelar",          label: "Cautelar — protección inmediata" },
  { value: "formativa_n1",      label: "Formativa N1" },
  { value: "disciplinaria_n2",  label: "Disciplinaria N2" },
  { value: "excepcional_n3",    label: "Excepcional N3 — suspensión / expulsión" },
];

//trámites
const CATEGORIAS_TRAMITE = [
  { value: "comunicacion_citaciones", label: "Comunicación y citaciones" },
  { value: "derivaciones",            label: "Derivaciones" },
  { value: "documentacion",           label: "Documentación" },
  { value: "coordinacion_interna",    label: "Coordinación interna" },
];

//tipos de trámites con sus opciones
const SUBTIPOS_POR_CATEGORIA = {
  comunicacion_citaciones: [
    { value: "citacion_apoderado",    label: "Citación a apoderado" },
    { value: "entrevista_estudiante", label: "Entrevista con estudiante" },
    { value: "entrevista_apoderado",  label: "Entrevista con apoderado" },
    { value: "notificacion_formal",   label: "Notificación formal" },
  ],
  derivaciones: [
    { value: "derivacion_orientacion",       label: "Derivación a orientación" },
    { value: "derivacion_psicologo",         label: "Derivación a psicólogo" },
    { value: "derivacion_dupla_psicosocial", label: "Derivación a dupla psicosocial" },
    { value: "derivacion_red_externa",       label: "Derivación a red externa (CESFAM, OPD…)" },
  ],
  documentacion: [
    { value: "firma_compromiso",      label: "Firma de compromiso" },
    { value: "acta_reunion",          label: "Acta de reunión" },
    { value: "registro_libro_clases", label: "Registro en libro de clases" },
    { value: "informe_seguimiento",   label: "Informe de seguimiento" },
  ],
  coordinacion_interna: [
    { value: "reunion_equipo_directivo",        label: "Reunión de equipo directivo" },
    { value: "comunicacion_inspector_general",  label: "Comunicación a inspector general" },
    { value: "activacion_protocolo",            label: "Activación de protocolo" },
  ],
};

export function FormularioHito() {
  const { id } = useParams(); //id del caso
  const navigate = useNavigate();

  const [fechaMinima, setFechaMinima] = useState("");
  const [estudiantesDelCaso, setEstudiantesDelCaso] = useState([]);
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState([]);
  const [estudiantesExtra, setEstudiantesExtra] = useState([]); // alumnos agregados fuera del caso

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/operate/cases/read", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const idNumerico = parseInt(id.replace("CASO-", ""), 10);
        const caso = data.find(c => c.id_caso === idNumerico);
        if (caso?.fecha_inicio) setFechaMinima(caso.fecha_inicio);
        if (caso?.estudiantes) {
          setEstudiantesDelCaso(caso.estudiantes.map(e => ({
            id_estudiante: e.estudiante.id_estudiante,
            nombre:        e.estudiante.nombre,
            nombre_curso:  e.estudiante.nombre_curso ?? "—",
            rol:           e.rol ?? null,
          })));
        }
      })
      .catch(() => {});
  }, [id]);

  const toggleEstudiante = (id_estudiante) => {
    setEstudiantesSeleccionados(prev =>
      prev.includes(id_estudiante)
        ? prev.filter(x => x !== id_estudiante)
        : [...prev, id_estudiante]
    );
  };

  // default del formulario
  const [tipo, setTipo]                   = useState("tramite");
  const [nivelMedida, setNivel]           = useState("cautelar");
  const [categoriaTramite, setCategoria]  = useState("comunicacion_citaciones");
  const [subtipo, setSubtipo]             = useState("citacion_apoderado");
  const [fecha, setFecha]                 = useState("");
  const [desc, setDesc]                   = useState("");
  const [archivos, setArchivos]           = useState([]); // [{uid, file}]
  const [loading, setLoading]             = useState(false);
  const [mensaje, setMensaje]             = useState({ texto: "", tipo: "" });

  // resetea el subtipo al cambiar la categoría del trámite
  const handleCategoria = (e) => {
    const cat = e.target.value;
    setCategoria(cat);
    setSubtipo(SUBTIPOS_POR_CATEGORIA[cat][0].value);
  };

  // Agregar archivos con uid estable para evitar bugs al borrar
  const handleArchivos = (e) => {
    const nuevos = Array.from(e.target.files).map(file => ({
      uid: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
    }));
    setArchivos(prev => [...prev, ...nuevos]);
    e.target.value = "";
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: "", tipo: "" });
    try {
      const token = localStorage.getItem("access_token");
      const idNumerico = parseInt(id.replace("CASO-", ""), 10);

      const formPayload = new FormData();
      formPayload.append("tipo",    tipo);
      formPayload.append("fecha",   fecha);
      formPayload.append("desc",    desc);

      // campos condicionales según el tipo de hito
      if (tipo === "medida") {
        formPayload.append("nivel_medida", nivelMedida);
      } else {
        formPayload.append("categoria_tramite", categoriaTramite);
        formPayload.append("subtipo_tramite",   subtipo);
      }

      const todosIds = [
        ...estudiantesSeleccionados,
        ...estudiantesExtra.map(e => e.id_estudiante),
      ].filter((id, i, arr) => arr.indexOf(id) === i);
      formPayload.append("estudiantes_ids_json", JSON.stringify(todosIds));

      // adjuntar archivos seleccionados
      archivos.forEach(({ file }) => formPayload.append("archivos", file));

      const res = await fetch(`/api/operate/cases/${idNumerico}/create/hito`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formPayload,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detalle = Array.isArray(err.detail)
          ? JSON.stringify(err.detail, null, 2)
          : err.detail;
        throw new Error(detalle ?? `Error ${res.status}`);
      }

      setMensaje({ texto: "Hito registrado exitosamente.", tipo: "success" });

      // lo devuelve al modal de detalle del caso
      setTimeout(() => navigate(`/cases/${id}`), 1200);
    } catch (error) {
      setMensaje({ texto: `Error al guardar: ${error.message}`, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 my-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Agregar Hito</h2>
        <p className="text-gray-500 text-sm">Registra una decisión o trámite en la línea de tiempo del {id}.</p>
      </div>

      {/* mensaje post envio */}
      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${
          mensaje.tipo === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Selector de trámite o medida */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de hito</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
          >
            <option value="tramite">Trámite</option>
            <option value="medida">Medida</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {tipo === "tramite"
              ? "Gestión administrativa: citación, entrevista, derivación, documentación…"
              : "Acción disciplinaria o formativa con nivel asignado."}
          </p>
        </div>

        {/* Trámite: categoría y subtipo */}
        {tipo === "tramite" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría del trámite</label>
              <select
                value={categoriaTramite}
                onChange={handleCategoria}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
              >
                {CATEGORIAS_TRAMITE.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de trámite</label>
              <select
                value={subtipo}
                onChange={e => setSubtipo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
              >
                {(SUBTIPOS_POR_CATEGORIA[categoriaTramite] ?? []).map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Medida: nivel */}
        {tipo === "medida" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nivel de la medida</label>
            <select
              value={nivelMedida}
              onChange={e => setNivel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
            >
              {NIVEL_MEDIDA.map(n => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Fecha del hito*/}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            required
            min={fechaMinima}
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
          />
          {fechaMinima && (
            <p className="text-xs text-gray-400 mt-1">La fecha no puede ser anterior a la apertura del caso ({fechaMinima}).</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
          <textarea
            required
            rows="4"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={tipo === "medida"
              ? "Describe la medida tomada, su fundamento y los compromisos asociados…"
              : "Describe el trámite realizado, quiénes participaron y los acuerdos…"
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700 resize-none"
          />
        </div>

        {/* Estudiantes involucrados en el hito */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Estudiantes involucrados <span className="text-gray-400 font-normal">(opcional)</span>
          </label>

          {/* Checkboxes: alumnos del caso */}
          {estudiantesDelCaso.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {estudiantesDelCaso.map(est => (
                <label key={est.id_estudiante} className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={estudiantesSeleccionados.includes(est.id_estudiante)}
                    onChange={() => toggleEstudiante(est.id_estudiante)}
                    className="w-4 h-4 accent-blue-700"
                  />
                  <span className="flex-1 text-sm text-gray-800 font-medium">{est.nombre}</span>
                  <span className="text-xs text-gray-400">{est.nombre_curso}</span>
                </label>
              ))}
            </div>
          )}

          {/* Buscador: alumnos fuera del caso */}
          <p className="text-xs text-gray-500 mb-1">Agregar otro estudiante no vinculado al caso:</p>
          <BuscadorEstudiante
            placeholder="Buscar por nombre, RUT o curso…"
            excluir={[
              ...estudiantesDelCaso.map(e => e.id_estudiante),
              ...estudiantesExtra.map(e => e.id_estudiante),
            ]}
            onSeleccionar={est => {
              if (est) setEstudiantesExtra(prev => [...prev, est]);
            }}
          />

          {/* Lista de alumnos extra agregados */}
          {estudiantesExtra.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {estudiantesExtra.map(est => (
                <li key={est.id_estudiante} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  <span className="font-medium">{est.nombre}</span>
                  <span className="text-xs text-gray-400 mx-2">{est.nombre_curso}</span>
                  <button
                    type="button"
                    onClick={() => setEstudiantesExtra(prev => prev.filter(e => e.id_estudiante !== est.id_estudiante))}
                    className="text-red-400 hover:text-red-600 font-bold flex-shrink-0"
                  >✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Documentos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Documentos adjuntos</label>
          <label className="flex flex-col items-center gap-1 px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
            {/* contador de archivos */}
            <span className="font-semibold text-gray-600">
              {archivos.length > 0 ? `${archivos.length} archivo${archivos.length !== 1 ? "s" : ""} seleccionado${archivos.length !== 1 ? "s" : ""}  clic para agregar más` : "Clic para seleccionar archivos"}
            </span>
            <span className="text-xs text-gray-400">Puedes seleccionar varios a la vez</span>
            <input type="file" multiple onChange={handleArchivos} className="hidden" />
          </label>
          {archivos.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {archivos.map(({ uid, file }) => (
                <li key={uid} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  <span className="truncate max-w-xs">{file.name}</span>
                  <button type="button"
                    onClick={() => setArchivos(prev => prev.filter(a => a.uid !== uid))}
                    className="ml-2 text-red-400 hover:text-red-600 font-bold flex-shrink-0">✕</button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-400 mt-1">Actas, resoluciones, informes u otros documentos de respaldo.</p>
        </div>
          {/* acciones finales */}
        <div className="flex justify-between items-center pt-2">
          <Link to={`/cases/${id}`}
            className="px-4 py-2 rounded-xl border-2 border-blue-900 text-blue-900 font-semibold text-sm hover:bg-blue-50 transition-colors">
            Volver al caso
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 rounded-lg text-white font-medium shadow transition ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }`}
          >
            {loading ? "Guardando" : "Guardar hito"}
          </button>
        </div>
      </form>
    </div>
  );
}