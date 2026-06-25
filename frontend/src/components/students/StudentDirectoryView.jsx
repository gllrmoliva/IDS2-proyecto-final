// src/components/StudentsDirectoryView.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '../../hooks/useStudents';

export function StudentDirectoryView() {
  const navigate = useNavigate();
  const { students, loading, error, fetchStudents } = useStudents();
  
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [cursoSeleccionado, setCursoSeleccionado] = useState('Todos');

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const CURSOS = ['Todos', ...new Set(students.map(e => e.curso))];

  const resultados = useMemo(() => {
    return students.filter(estudiante => {
      const matchesTermino = 
        estudiante.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        estudiante.rut.includes(terminoBusqueda);
      const matchesCurso = cursoSeleccionado === 'Todos' || estudiante.curso === cursoSeleccionado;
      
      return matchesTermino && matchesCurso;
    });
  }, [students, terminoBusqueda, cursoSeleccionado]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-blue-900 font-serif">Directorio de Estudiantes</h2>
          <p className="text-gray-500 text-sm">Módulo de Convivencia Escolar Panoptes</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">{error}</div>}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o RUT..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
          />
          <select
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700"
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
          >
            {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-blue-900 text-white text-xs uppercase tracking-wide font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Estudiante</th>
                <th className="px-4 py-3 text-left">RUT</th>
                <th className="px-4 py-3 text-left">Curso</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-600">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">Cargando directorio...</td></tr>
              ) : resultados.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-400 italic">No se encontraron estudiantes.</td></tr>
              ) : (
                resultados.map((estudiante) => (
                  <tr key={estudiante.rut} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{estudiante.nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs">{estudiante.rut}</td>
                    <td className="px-4 py-3">{estudiante.curso}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700">
                        {estudiante.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => navigate(`/students/${estudiante.rut}`)}
                        className="px-3 py-1.5 bg-blue-900 text-white rounded-md text-xs font-medium hover:bg-blue-800 transition"
                      >
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
    </div>
  );
}