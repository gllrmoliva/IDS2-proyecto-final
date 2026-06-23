// src/hooks/useStudents.js
import { useState, useCallback } from "react";

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Sesión no válida.");

      const res = await fetch("/api/students/get_all", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al cargar el directorio de estudiantes.");
      
      const data = await res.json();
      setStudents(data.map(e => ({
        rut: e.id_estudiante,
        nombre: e.nombre,
        curso: e.curso?.nombre_curso ?? "Sin curso asignado",
        estado: "Regular" // Placeholder hasta que el backend envíe este flag
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

    const fetchStudentProfile = useCallback(async (idEstudiante) => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Sesión no válida.");

        // 1. Obtener la información base desde el directorio general
        // Esto garantiza que el Curso siempre exista, tenga casos o no.
        const dirRes = await fetch("/api/students/get_all", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!dirRes.ok) throw new Error("Error al cargar datos del directorio.");
        const directory = await dirRes.json();
        const studentInfo = directory.find(e => e.id_estudiante === idEstudiante);

        if (!studentInfo) throw new Error("Estudiante no encontrado en el sistema.");

        // 2. Obtener el historial de casos
        const casesRes = await fetch(`/api/students/${idEstudiante}/cases`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (casesRes.status === 403) throw new Error("No tienes autorización para ver a este estudiante.");
        if (!casesRes.ok) throw new Error("Error al cargar el historial del estudiante.");
        
        const casesData = await casesRes.json();

        setActiveProfile({
          rut: studentInfo.id_estudiante,
          nombre: studentInfo.nombre,
          curso: studentInfo.curso?.nombre_curso ?? "Sin curso asignado",
          promedioGeneral: "N/A",
          asistencia: "N/A",
          historialCasos: casesData.map(c => ({
            id: `CASO-${String(c.id_caso).padStart(3, '0')}`,
            _id_caso: c.id_caso,
            fecha: c.fecha_inicio,
            gravedad: c.gravedad,
            descripcion: c.desc,
            estado: c.estado
          }))
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, []);

    return { students, activeProfile, loading, error, fetchStudents, fetchStudentProfile };
}
