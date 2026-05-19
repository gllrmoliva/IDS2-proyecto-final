// mockIncidents.js
// Datos simulados para desarrollo — reemplazar por llamadas reales al backend
// cuando esté disponible (ver useIncidents.js)

export const MOCK_INCIDENTS = [
  {
    id: "INC-001",
    fecha: "2025-04-15",
    alumno: { nombre: "Valentina Rojas Soto", curso: "3°A", rut: "21.345.678-9" },
    tipo: "Agresión verbal",
    gravedad: "baja",
    descripcion: "Alumna insultó a compañero durante el recreo de manera reiterada.",
    reportadoPor: "Marcela Rojas",
    rolReportante: "Inspectora",
    estado: "pendiente",
    involucrados: [
      { nombre: "Valentina Rojas Soto", rol: "Estudiante (victimaria)" },
      { nombre: "Matías González Vera", rol: "Estudiante (afectado)" },
    ],
    evidencia: null,
  },

  {
    id: "INC-002",
    fecha: "2025-04-12",
    alumno: { nombre: "Sebastián Muñoz Torres", curso: "2°B", rut: "21.678.901-2" },
    tipo: "Daño a material del colegio",
    gravedad: "media",
    descripcion: "Alumno rayó puertas del baño con objeto cortante. Daño estimado considerable.",
    reportadoPor: "Luis Vega",
    rolReportante: "Profesor de Asignatura",
    estado: "pendiente",
    involucrados: [
      { nombre: "Sebastián Muñoz Torres", rol: "Estudiante (responsable)" },
    ],
    evidencia: "foto_danio_banio.jpg",
  },

  {
    id: "INC-003",
    fecha: "2025-04-08",
    alumno: { nombre: "Matías González Vera", curso: "3°A", rut: "21.456.789-0" },
    tipo: "Conducta disruptiva en aula",
    gravedad: "baja",
    descripcion: "Interrumpió la clase reiteradamente sin respetar indicaciones del docente.",
    reportadoPor: "Luis Vega",
    rolReportante: "Profesor de Asignatura",
    estado: "pendiente",
    involucrados: [
      { nombre: "Matías González Vera", rol: "Estudiante" },
    ],
    evidencia: null,
  },

  {
    id: "INC-004",
    fecha: "2025-03-28",
    alumno: { nombre: "Valentina Rojas Soto", curso: "3°A", rut: "21.345.678-9" },
    tipo: "Agresión física",
    gravedad: "media",
    descripcion: "Empujó a compañera en la escalera. La compañera sufrió una contusión leve.",
    reportadoPor: "Marcela Rojas",
    rolReportante: "Inspectora",
    estado: "aprobado",
    involucrados: [
      { nombre: "Valentina Rojas Soto", rol: "Estudiante (agresora)" },
      { nombre: "Isidora Campos Núñez", rol: "Estudiante (afectada)" },
    ],
    evidencia: "acta_enfermeria.pdf",
  },

  {
    id: "INC-005",
    fecha: "2025-03-15",
    alumno: { nombre: "Diego Herrera Lagos", curso: "1°C", rut: "21.890.123-4" },
    tipo: "Acoso entre pares",
    gravedad: "alta",
    descripcion: "Intimidación sistemática a compañero del mismo curso durante varias semanas.",
    reportadoPor: "Ana Pérez",
    rolReportante: "Profesora Jefa",
    estado: "aprobado",
    involucrados: [
      { nombre: "Diego Herrera Lagos", rol: "Estudiante (agresor)" },
      { nombre: "Felipe Araya Ramos", rol: "Estudiante (víctima)" },
      { nombre: "Tomás Espinoza Gil", rol: "Testigo" },
    ],
    evidencia: "declaraciones_testigos.pdf",
  },
  
  {
    id: "INC-006",
    fecha: "2025-03-10",
    alumno: { nombre: "Catalina Vega Morales", curso: "2°B", rut: "21.789.012-3" },
    tipo: "Uso de celular en clase",
    gravedad: "baja",
    descripcion: "Alumna utilizó el celular durante prueba de matemáticas pese a advertencias.",
    reportadoPor: "Luis Vega",
    rolReportante: "Profesor de Asignatura",
    estado: "rechazado",
    involucrados: [
      { nombre: "Catalina Vega Morales", rol: "Estudiante" },
    ],
    evidencia: null,
  },
];

// Opciones para los filtros
export const FILTER_OPTIONS = {
  estados: ["todos", "pendiente", "aprobado", "rechazado"],
  gravedades: ["todas", "baja", "media", "alta"],
  cursos: ["todos", "1°C", "2°B", "3°A", "4°D"],
};

// Filtros por defecto — exportado aquí para evitar que componentes mezclen
// exports de datos con exports de React (causa warnings de Fast Refresh en Vite)
export const INITIAL_FILTERS = {
  search: "", estado: "todos", gravedad: "todas", curso: "todos",
  periodo: "todos", fechaDesde: "", fechaHasta: "",
};
