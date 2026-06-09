import React, { useState } from 'react';

export default function BuscadorEstudiantes() {
  // Base de datos simulada de estudiantes de Panoptes
  const estudiantesMock = [
    { id: 1, nombre: "Juan Pablo Dudas", rut: "19.876.543-2", curso: "2° Medio B", estado: "Regular" },
    { id: 2, nombre: "María Jesús Ignacia", rut: "20.123.456-k", curso: "4° Medio A", estado: "Bajo Observación" },
    { id: 3, nombre: "Pedro Almonte Fuenzalida", rut: "18.345.678-9", curso: "3° Medio C", estado: "Regular" }
  ];

  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [cursoSeleccionado, setCursoSeleccionado] = useState('Todos');

  // Filtrado lógico por término (Nombre/RUT) y por Curso
  const resultados = estudiantesMock.filter(estudiante => {
    const matchesTermino = 
      estudiante.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      estudiante.rut.includes(terminoBusqueda);
    
    const matchesCurso = cursoSeleccionado === 'Todos' || estudiante.curso === cursoSeleccionado;
    
    return matchesTermino && matchesCurso;
  });

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 my-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Buscador Global de Estudiantes</h2>
        <p className="text-gray-500 text-sm">Módulo de Gestión de Casos - Registro de Convivencia Escolar Panoptes</p>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o RUT..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            data-testid="input-busqueda"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700"
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
            data-testid="select-curso"
          >
            <option value="Todos">Todos los cursos</option>
            <option value="2° Medio B">2° Medio B</option>
            <option value="3° Medio C">3° Medio C</option>
            <option value="4° Medio A">4° Medio A</option>
          </select>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-700 font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">Estudiante</th>
              <th className="px-4 py-3 text-left">RUT</th>
              <th className="px-4 py-3 text-left">Curso</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-600" data-testid="lista-resultados">
            {resultados.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-400 italic">
                  No se encontraron estudiantes que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              resultados.map((estudiante) => (
                <tr key={estudiante.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">{estudiante.nombre}</td>
                  <td className="px-4 py-3 font-mono">{estudiante.rut}</td>
                  <td className="px-4 py-3">{estudiante.curso}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      estudiante.estado === 'Regular' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {estudiante.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 active:scale-95 transition">
                      Ver Hoja de Vida
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
