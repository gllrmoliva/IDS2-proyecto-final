// src/components/students/StudentProfileView.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents } from '../../hooks/useStudents';
import { useIncidents } from '../../hooks/useIncidents';
import { IncidentDetailModal } from '../incidents/IncidentDetailModal';

export function StudentProfileView() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  // Hooks
  const { activeProfile: estudiante, loading, error, fetchStudentProfile } = useStudents();
  const { incidents, handleAprobar, handleRechazar, handleRevertir, handleElevar } = useIncidents();

  // Modal State
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    if (id) fetchStudentProfile(id);
  }, [id, fetchStudentProfile]);

  // Filtrar incidentes donde el estudiante sea autor principal o parte de los involucrados
  const studentIncidents = incidents.filter(inc => 
    inc.alumno.rut === id || inc.involucrados?.some(inv => inv.rut === id)
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando expediente...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!estudiante) return null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button onClick={() => navigate('/students')} className="mb-4 text-sm text-blue-700 hover:underline">
        ← Volver al directorio
      </button>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        
        {/* Encabezado del Perfil */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-blue-900 font-serif">{estudiante.nombre}</h2>
            <p className="text-gray-500 font-medium mt-1">RUT: {estudiante.rut} | {estudiante.curso}</p>
          </div>
        </div>

        {/* Indicadores Académicos (Placeholders) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Promedio General</p>
            <p className="text-2xl font-bold text-gray-400">{estudiante.promedioGeneral}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Asistencia Anual</p>
            <p className="text-2xl font-bold text-gray-400">{estudiante.asistencia}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Columna Izquierda: Casos Disciplinarios */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Historial de Casos</h3>
            {estudiante.historialCasos.length === 0 ? (
              <p className="text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                El estudiante no registra participación en casos formales de convivencia escolar.
              </p>
            ) : (
              <div className="space-y-3">
                {estudiante.historialCasos.map((caso) => (
                  <div 
                    key={caso.id} 
                    onClick={() => navigate(`/cases/${caso.id}`)}
                    className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500 font-medium font-mono">{caso.id}</span>
                      <div className="flex gap-2">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md uppercase bg-gray-100 text-gray-700">
                          {caso.estado}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase ${
                          caso.gravedad === 'muy_grave' ? 'bg-red-100 text-red-700' :
                          caso.gravedad === 'grave' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {caso.gravedad.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mt-2">{caso.descripcion}</p>
                    <p className="text-xs text-gray-400 mt-3">Iniciado: {caso.fecha}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Incidentes (Nivel 1) */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Incidentes Aislados</h3>
            {studentIncidents.length === 0 ? (
              <p className="text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                El estudiante no registra incidentes reportados.
              </p>
            ) : (
              <div className="space-y-3">
                {studentIncidents.map((inc) => (
                  <div 
                    key={inc.id} 
                    onClick={() => setSelectedIncident(inc)}
                    className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:border-yellow-400 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500 font-medium font-mono">{inc.id}</span>
                      <div className="flex gap-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase ${
                          inc.estado === 'aprobado' ? 'bg-green-100 text-green-700' :
                          inc.estado === 'rechazado' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {inc.estado}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-800 font-medium text-sm mt-1">{inc.tipo}</p>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{inc.descripcion}</p>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-xs text-gray-400">{inc.fecha}</p>
                      <p className="text-xs font-medium text-gray-500">Por: {inc.reportadoPor}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Renderizamos el Modal de Detalles de Incidente globalmente si hay uno seleccionado */}
      {selectedIncident && (
        <IncidentDetailModal 
          incident={selectedIncident} 
          onClose={() => setSelectedIncident(null)} 
          onAprobar={handleAprobar} 
          onRechazar={handleRechazar} 
          onRevertir={handleRevertir} 
          onElevar={handleElevar} 
        />
      )}
    </div>
  );
}
