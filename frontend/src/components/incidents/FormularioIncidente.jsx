import React, { useState, useMemo } from 'react';


const MOCK_ESTUDIANTES = [
  { id_estudiante: '21.345.678-9', nombre: 'Valentina Rojas Soto',    nombre_curso: '3°A' },
  { id_estudiante: '21.456.789-0', nombre: 'Matías González Vera',    nombre_curso: '3°A' },
  { id_estudiante: '21.567.890-1', nombre: 'Isidora Campos Núñez',    nombre_curso: '3°A' },
  { id_estudiante: '21.678.901-2', nombre: 'Sebastián Muñoz Torres',  nombre_curso: '2°B' },
  { id_estudiante: '21.789.012-3', nombre: 'Catalina Vega Morales',   nombre_curso: '2°B' },
  { id_estudiante: '21.890.123-4', nombre: 'Diego Herrera Lagos',     nombre_curso: '1°C' },
  { id_estudiante: '21.901.234-5', nombre: 'Javiera Soto Bravo',      nombre_curso: '4°D' },
];


const CURSOS = ['Todos', ...new Set(MOCK_ESTUDIANTES.map(e => e.nombre_curso))];


function BuscadorEstudiante({ placeholder, onSeleccionar, excluir = [] }) {
  const [query, setQuery] = useState('');
  const [curso, setCurso] = useState('Todos');
  const [abierto, setAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const resultados = useMemo(() => {
    const q = query.toLowerCase();
    return MOCK_ESTUDIANTES.filter(e => {
      if (excluir.includes(e.id_estudiante)) return false;
      if (curso !== 'Todos' && e.nombre_curso !== curso) return false;
      if (!q) return true;
      return (
        e.nombre.toLowerCase().includes(q) ||
        e.id_estudiante.includes(q)
      );
    });
  }, [query, curso, excluir]);

  const handleSeleccionar = (est) => {
    setSeleccionado(est);
    setQuery(est.nombre);
    setAbierto(false);
    onSeleccionar(est);
  };

  const handleLimpiar = () => {
    setSeleccionado(null);
    setQuery('');
    setCurso('Todos');
    onSeleccionar(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="flex gap-2 items-center">
        {/* Filtro por curso */}
        <select
          value={curso}
          onChange={(e) => { setCurso(e.target.value); setAbierto(true); }}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700 text-sm"
          style={{ minWidth: '90px' }}
        >
          {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setAbierto(true); if (seleccionado) { setSeleccionado(null); onSeleccionar(null); } }}
          onFocus={() => setAbierto(true)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
        />
        {seleccionado && (
          <button type="button" onClick={handleLimpiar} className="text-gray-400 hover:text-gray-600 text-lg px-1">✕</button>
        )}
      </div>

      {abierto && !seleccionado && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setAbierto(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
            background: 'white', border: '1px solid #d1d5db', borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxHeight: '180px', overflowY: 'auto',
          }}>
            {resultados.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No se encontraron estudiantes</div>
            ) : (
              resultados.map(est => (
                <div
                  key={est.id_estudiante}
                  onClick={() => handleSeleccionar(est)}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium text-gray-800">{est.nombre}</span>
                  <span className="text-gray-400 ml-2">— {est.nombre_curso} · {est.id_estudiante}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {seleccionado && (
        <p className="text-xs text-gray-400 mt-1">{seleccionado.nombre_curso} · {seleccionado.id_estudiante}</p>
      )}
    </div>
  );
}

export default function FormularioIncidente() {
  const [formData, setFormData] = useState({
    fecha: '',
    descripcion: '',
    gravedad: 'baja',
  });

  const [involucradoPrincipal, setInvolucradoPrincipal] = useState(null);
  const [otrosInvolucrados, setOtrosInvolucrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const agregarOtroInvolucrado = () => {
    setOtrosInvolucrados([...otrosInvolucrados, null]);
  };

  const actualizarOtroInvolucrado = (index, estudiante) => {
    const nuevos = [...otrosInvolucrados];
    nuevos[index] = estudiante;
    setOtrosInvolucrados(nuevos);
  };

  const quitarOtroInvolucrado = (index) => {
    setOtrosInvolucrados(otrosInvolucrados.filter((_, i) => i !== index));
  };

  // IDs ya seleccionados para excluirlos de otros buscadores
  const idsSeleccionados = [
    involucradoPrincipal?.id_estudiante,
    ...otrosInvolucrados.map(e => e?.id_estudiante),
  ].filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      // TODO: reemplazar por fetch real:
      // const res = await fetch('/api/operate/incidents/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     desc:        formData.descripcion,
      //     fecha:       formData.fecha.split('T')[0],
      //     gravedad:    formData.gravedad,
      //     estudiantes: idsSeleccionados,
      //   }),
      // });
      // if (!res.ok) throw new Error();

      setTimeout(() => {
        setMensaje({ texto: 'Incidente registrado exitosamente en Panoptes.', tipo: 'success' });
        setFormData({ fecha: '', descripcion: '', gravedad: 'baja' });
        setInvolucradoPrincipal(null);
        setOtrosInvolucrados([]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMensaje({ texto: 'Error al conectar con el servidor.', tipo: 'error' });
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
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>

        {/* Involucrado principal */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Estudiante Involucrado Principal</label>
          <BuscadorEstudiante
            placeholder="Buscar por nombre, RUT o curso…"
            onSeleccionar={setInvolucradoPrincipal}
            excluir={otrosInvolucrados.map(e => e?.id_estudiante).filter(Boolean)}
          />
          <p className="text-xs text-gray-400 mt-1">El sistema cruzará este dato con el Sistema Curricular externo.</p>
        </div>

        {/* Otros involucrados */}
        {otrosInvolucrados.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Otros Involucrados</label>
            {otrosInvolucrados.map((_, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <BuscadorEstudiante
                    placeholder="Buscar por nombre, RUT o curso…"
                    onSeleccionar={(est) => actualizarOtroInvolucrado(index, est)}
                    excluir={[
                      involucradoPrincipal?.id_estudiante,
                      ...otrosInvolucrados.filter((_, i) => i !== index).map(e => e?.id_estudiante),
                    ].filter(Boolean)}
                  />
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