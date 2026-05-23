import React, { useState } from 'react';
export default function FormularioIncidente() {
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    descripcion: '',
    categoria: 'conflicto_pares',
    estudianteRut: ''
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      setTimeout(() => {
        setMensaje({ texto: 'Incidente registrado exitosamente en Panoptes.', tipo: 'success' });
        setFormData({ titulo: '', fecha: '', descripcion: '', categoria: 'conflicto_pares', estudianteRut: '' });
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
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Título o Asunto Breve</label>
          <input
            type="text"
            name="titulo"
            required
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Ej. Altercado en el patio durante el recreo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
          />
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría Inicial</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
            >
              <option value="conflicto_pares">Conflicto entre pares</option>
              <option value="agresion_verbal">Agresión verbal / Psicológica</option>
              <option value="acoso_escolar">Presunto acoso escolar (Bullying)</option>
              <option value="falta_conductual">Falta conductual normativa</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">RUT del Estudiante Involucrado</label>
          <input
            type="text"
            name="estudianteRut"
            required
            value={formData.estudianteRut}
            onChange={handleChange}
            placeholder="12.345.678-K"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
          />
          <p className="text-xs text-gray-400 mt-1">El sistema cruzará este dato con el Sistema Curricular externo.</p>
        </div>

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
