import React, { useState, useEffect } from 'react';

export default function PerfilEstudiante() {
  // Estado simulado para la hoja de vida del estudiante
  const [estudiante, setEstudiante] = useState({
    nombre: "Juan Pablo Dudas",
    rut: "19.876.543-2",
    curso: "2° Medio B",
    promedioGeneral: "5.8",
    asistencia: "92%",
    historialIncidentes: [
      { id: 1, fecha: "2026-04-12", gravedad: "baja", descripcion: "Atraso reiterado al ingreso del primer bloque." },
      { id: 2, fecha: "2026-05-28", gravedad: "media", descripcion: "Estudiantes se gritan en el pasillo central durante el recreo." }
    ]
  });

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 my-8">
      {/* Encabezado del Perfil */}
      <div className="flex justify-between items-center border-b pb-6 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800" data-testid="student-name">{estudiante.nombre}</h2>
          <p className="text-gray-500 font-medium">RUT: {estudiante.rut} | Curso: {estudiante.curso}</p>
        </div>
        <span className="px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-full text-sm">
          Ficha Regular
        </span>
      </div>

      {/* Indicadores Académicos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Promedio General</p>
          <p className="text-2xl font-bold text-gray-800">{estudiante.promedioGeneral}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Asistencia Anual</p>
          <p className="text-2xl font-bold text-gray-800">{estudiante.asistencia}</p>
        </div>
      </div>

      {/* Historial de la Hoja de Vida (Sección Crítica para Panoptes) */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Historial de Incidentes y Convivencia</h3>
        {estudiante.historialIncidentes.length === 0 ? (
          <p className="text-gray-500 italic">El estudiante no registra observaciones en su hoja de vida.</p>
        ) : (
          <div className="space-y-4">
            {estudiante.historialIncidentes.map((incidente) => (
              <div key={incidente.id} className="p-4 border rounded-lg bg-white shadow-sm hover:border-blue-300 transition">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400 font-medium">{incidente.fecha}</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase ${
                    incidente.gravedad === 'alta' ? 'bg-red-100 text-red-700' :
                    incidente.gravedad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    Gravedad {incidente.gravedad}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{incidente.descripcion}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}