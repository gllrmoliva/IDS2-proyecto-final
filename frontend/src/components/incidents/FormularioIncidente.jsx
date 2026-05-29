import React, { useState } from 'react';
import { BuscadorEstudiante } from '../shared/StudentSearch';

// Valores del enum rol_involucrado 
// null = sin rol 
const ROLES_INVOLUCRADO = [
  { value: null,                   label: 'Sin rol' },
  { value: 'autor_agresor',        label: 'Autor / Agresor' },
  { value: 'afectado_victima',     label: 'Afectado / Víctima' },
  { value: 'complice',             label: 'Cómplice' },
  { value: 'testigo_espectador',   label: 'Testigo / Espectador' },
];

// Valores del enum categoria_convivencia 
const CATEGORIAS_CONVIVENCIA = [
  { value: 'violencia_fisica',              label: 'Violencia física' },
  { value: 'violencia_psicologica_acoso',   label: 'Violencia psicológica / Acoso' },
  { value: 'disrupcion_desacato',           label: 'Disrupción / Desacato' },
  { value: 'probidad_fraude',               label: 'Probidad / Fraude' },
  { value: 'dano_infraestructura_bienes',   label: 'Daño a infraestructura o bienes' },
  { value: 'conductas_riesgo_sustancias',   label: 'Conductas de riesgo / Sustancias' },
  { value: 'privacidad_tecnologia',         label: 'Privacidad / Tecnología' },
  { value: 'sexualidad_obscenidad',         label: 'Sexualidad / Obscenidad' },
  { value: 'valores_institucionales',       label: 'Valores institucionales' },
  { value: 'otro',                          label: 'Otro' },
];


const USE_MOCK = false; // 

export default function FormularioIncidente() {
  const [formData, setFormData] = useState({
    fecha: '',
    descripcion: '',
    gravedad: 'leve',
    categoria: 'violencia_fisica',
  });

  const [involucradoPrincipal, setInvolucradoPrincipal] = useState(null);
  const [rolPrincipal, setRolPrincipal] = useState(null); // null = sin rol
  const [otrosInvolucrados, setOtrosInvolucrados] = useState([]); 
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const handleArchivos = (e) => {
    const nuevos = Array.from(e.target.files);
    setArchivos(prev => [...prev, ...nuevos]);
    e.target.value = '';
  };

  const quitarArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const agregarOtroInvolucrado = () => {
    setOtrosInvolucrados([...otrosInvolucrados, { estudiante: null, rol: null }]);
  };

  const actualizarOtroInvolucrado = (index, campo, valor) => {
    const nuevos = [...otrosInvolucrados];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setOtrosInvolucrados(nuevos);
  };

  const quitarOtroInvolucrado = (index) => {
    setOtrosInvolucrados(otrosInvolucrados.filter((_, i) => i !== index));
  };

  // IDs ya seleccionados 
  const idsSeleccionados = [
    involucradoPrincipal?.id_estudiante,
    ...otrosInvolucrados.map(e => e?.estudiante?.id_estudiante),
  ].filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      if (USE_MOCK) { /* ... lógica de mock igual ... */ }

      const token = sessionStorage.getItem('panoptes_token') || activeToken; // Asegura tener el token

      // 1. Usar FormData
      const formDataToSend = new FormData();
      
      formDataToSend.append("desc", formData.descripcion);
      formDataToSend.append("fecha", formData.fecha.split('T')[0]);
      formDataToSend.append("gravedad", formData.gravedad); // Asegúrate de que sea 'leve', 'grave' o 'muy_grave'
      formDataToSend.append("categoria", formData.categoria);
      
      // 2. Construir el arreglo de estudiantes con roles según el esquema EstudianteRolCreate
      const estudiantesPayload = [];
      
      if (involucradoPrincipal?.id_estudiante) {
        estudiantesPayload.push({
          id_estudiante: involucradoPrincipal.id_estudiante,
          rol: rolPrincipal || null
        });
      }
      
      otrosInvolucrados.forEach(inv => {
        if (inv?.estudiante?.id_estudiante) {
          estudiantesPayload.push({
            id_estudiante: inv.estudiante.id_estudiante,
            rol: inv.rol || null
          });
        }
      });

      // 3. Serializar y adjuntar EXACTAMENTE con la llave que pide tu dependencia de FastAPI
      formDataToSend.append("estudiantes_json", JSON.stringify(estudiantesPayload));

      // 4. Adjuntar archivos
      archivos.forEach(file => {
          formDataToSend.append("archivos", file);
      });

      // 5. Enviar el fetch (sin Content-Type manual)
      const res = await fetch('/api/operate/incidents/create', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formDataToSend,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Forzamos a que el arreglo de errores de FastAPI se convierta en un string legible
        const detalleError = Array.isArray(err.detail) 
          ? JSON.stringify(err.detail, null, 2) 
          : err.detail;
          
        console.error("Detalle del error 422:", detalleError);
        throw new Error(detalleError ?? `Error ${res.status}`);
      }

      setMensaje({ texto: 'Incidente registrado exitosamente en Panoptes.', tipo: 'success' });
      setFormData({ fecha: '', descripcion: '', gravedad: 'baja', categoria: 'violencia_fisica' });
      setInvolucradoPrincipal(null);
      setOtrosInvolucrados([]);
      setArchivos([]);
      setLoading(false);
    } catch (error) {
      setMensaje({ texto: `Error: ${error.message}`, tipo: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 my-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reportar Nuevo Incidente</h2>
        <p className="text-gray-500 text-sm">Ingrese los detalles iniciales del suceso de convivencia escolar.</p>
      </div>

      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Categoría */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría del incidente</label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
          >
            {CATEGORIAS_CONVIVENCIA.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha y Hora</label>
            <input
              type="datetime-local"
              name="fecha"
              required
              value={formData.fecha}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Gravedad</label>
            <select
              name="gravedad"
              value={formData.gravedad}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
            >
              <option value="leve">Leve</option>
              <option value="grave">Grave</option>
              <option value="muy_grave">Muy grave</option>
            </select>
          </div>
        </div>

        {/* Involucrado principal */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Estudiante Involucrado Principal</label>
          <BuscadorEstudiante
            placeholder="Buscar por nombre, RUT o curso…"
            onSeleccionar={setInvolucradoPrincipal}
            excluir={otrosInvolucrados.map(e => e?.estudiante?.id_estudiante).filter(Boolean)}
          />
          <div className="mt-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Rol en el incidente</label>
            <select
              value={rolPrincipal}
              onChange={e => setRolPrincipal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700 text-sm"
            >
              {ROLES_INVOLUCRADO.map(r => <option key={r.value ?? 'null'} value={r.value ?? ''}>{r.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-1">El sistema cruzará este dato con el Sistema Curricular externo.</p>
        </div>

        {/* Otros involucrados */}
        {otrosInvolucrados.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Otros Involucrados</label>
            {otrosInvolucrados.map((inv, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 flex flex-col gap-2">
                  <BuscadorEstudiante
                    placeholder="Buscar por nombre, RUT o curso…"
                    onSeleccionar={(est) => actualizarOtroInvolucrado(index, 'estudiante', est)}
                    excluir={[
                      involucradoPrincipal?.id_estudiante,
                      ...otrosInvolucrados.filter((_, i) => i !== index).map(e => e?.estudiante?.id_estudiante),
                    ].filter(Boolean)}
                  />
                  <select
                    value={inv?.rol ?? ''}
                    onChange={e => actualizarOtroInvolucrado(index, 'rol', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700 text-sm"
                  >
                    {ROLES_INVOLUCRADO.map(r => <option key={r.value ?? 'null'} value={r.value ?? ''}>{r.label}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => quitarOtroInvolucrado(index)}
                  className="mt-2 text-red-400 hover:text-red-600 font-bold text-lg px-1"
                  title="Quitar"
                >✕</button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={agregarOtroInvolucrado}
          className="text-sm text-blue-600 font-semibold hover:underline"
        >
          + Agregar otro involucrado
        </button>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción de los Hechos</label>
          <textarea
            name="descripcion"
            required
            rows="4"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Describa de forma objetiva lo sucedido, indicando las acciones observadas..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700 resize-none"
          />
        </div>

        {/* Evidencia */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Evidencia</label>
          <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
            Adjuntar archivo(s)
            <input type="file" multiple onChange={handleArchivos} className="hidden" />
          </label>
          {archivos.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {archivos.map((archivo, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  <span className="truncate max-w-xs">{archivo.name}</span>
                  <button type="button" onClick={() => quitarArchivo(i)}
                    className="ml-2 text-red-400 hover:text-red-600 font-bold flex-shrink-0">✕</button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-400 mt-1">Puedes adjuntar imágenes, documentos u otros archivos.</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 rounded-lg text-white font-medium shadow transition ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {loading ? 'Registrando...' : 'Enviar Reporte'}
          </button>
        </div>
      </form>
    </div>
  );
}
