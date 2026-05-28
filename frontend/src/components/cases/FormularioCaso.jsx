import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BuscadorEstudiante } from '../shared/StudentSearch';


export default function FormularioCaso() {
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    desc:         '',
    gravedad:     'baja',
  });

  const [estudiantePrincipal, setEstudiantePrincipal] = useState(null);
  const [otrosEstudiantes, setOtrosEstudiantes]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [mensaje, setMensaje]   = useState({ texto: '', tipo: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const agregarEstudiante = () => setOtrosEstudiantes([...otrosEstudiantes, null]);

  const actualizarEstudiante = (index, estudiante) => {
    const nuevos = [...otrosEstudiantes];
    nuevos[index] = estudiante;
    setOtrosEstudiantes(nuevos);
  };

  const quitarEstudiante = (index) => {
    setOtrosEstudiantes(otrosEstudiantes.filter((_, i) => i !== index));
  };

  const idsSeleccionados = [
    estudiantePrincipal?.id_estudiante,
    ...otrosEstudiantes.map(e => e?.id_estudiante),
  ].filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      // TODO: reemplazar por fetch real:
      // const res = await fetch('/api/operate/cases/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     desc:         formData.desc,
      //     fecha_inicio: formData.fecha_inicio,
      //     gravedad:     formData.gravedad,
      //     estado:       'abierto',
      //     estudiantes:  idsSeleccionados,
      //   }),
      // });
      // if (!res.ok) throw new Error();

      setTimeout(() => {
        setMensaje({ texto: 'Caso creado exitosamente en Panoptes.', tipo: 'success' });
        setFormData({ fecha_inicio: '', desc: '', gravedad: 'baja' });
        setEstudiantePrincipal(null);
        setOtrosEstudiantes([]);
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
        <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Caso</h2>
        <p className="text-gray-500 text-sm">Complete los datos para abrir un nuevo caso de convivencia.</p>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              name="fecha_inicio"
              required
              value={formData.fecha_inicio}
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

        {/* Estudiante principal */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Estudiante Involucrado Principal</label>
          <BuscadorEstudiante
            placeholder="Buscar por nombre, RUT o curso…"
            onSeleccionar={setEstudiantePrincipal}
            excluir={otrosEstudiantes.map(e => e?.id_estudiante).filter(Boolean)}
          />
          <p className="text-xs text-gray-400 mt-1">El sistema cruzará este dato con el Sistema Curricular externo.</p>
        </div>

        {/* Otros estudiantes */}
        {otrosEstudiantes.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Otros Estudiantes Involucrados</label>
            {otrosEstudiantes.map((_, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <BuscadorEstudiante
                    placeholder="Buscar por nombre, RUT o curso…"
                    onSeleccionar={(est) => actualizarEstudiante(index, est)}
                    excluir={[
                      estudiantePrincipal?.id_estudiante,
                      ...otrosEstudiantes.filter((_, i) => i !== index).map(e => e?.id_estudiante),
                    ].filter(Boolean)}
                  />
                </div>
                <button type="button" onClick={() => quitarEstudiante(index)}
                  className="mt-2 text-red-400 hover:text-red-600 font-bold text-lg px-1" title="Quitar">✕</button>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={agregarEstudiante}
          className="text-sm text-blue-600 font-semibold hover:underline">
          + Agregar otro estudiante
        </button>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción del Caso</label>
          <textarea
            name="desc"
            required
            rows="4"
            value={formData.desc}
            onChange={handleChange}
            placeholder="Describa el contexto y los antecedentes del caso…"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700 resize-none"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <Link to="/cases" className="text-sm text-gray-500 hover:underline">
            ← Volver a casos
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 rounded-lg text-white font-medium shadow transition ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {loading ? 'Creando...' : 'Crear Caso'}
          </button>
        </div>
      </form>
    </div>
  );
}