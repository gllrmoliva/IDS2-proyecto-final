// mockCases.js
// Datos simulados para desarrollo — reemplazar por fetch('/api/operate/cases/get_all')

export const MOCK_CASES = [
  {
    id_caso: 1,
    id_coordinador: "coord-001",
    estado: "abierto",
    fecha_inicio: "2025-03-28",
    fecha_cierre: null,
    desc: "Alumna presenta historial de agresiones verbales y físicas hacia compañeros.",
    gravedad: "media",
    estudiantes: [
      { id_estudiante: "21.345.678-9", nombre: "Valentina Rojas Soto", nombre_curso: "3°A" },
      { id_estudiante: "21.567.890-1", nombre: "Isidora Campos Núñez", nombre_curso: "3°A" },
    ],
    hitos: [
      { id_hito: 1, id_caso: 1, fecha: "2025-03-28", desc: "Primer incidente de agresión física documentado. Se informa a apoderado.", documentos: [{ id_doc: 1, nombre_original: "acta_entrevista_01.pdf", mime_type: "application/pdf" }] },
      { id_hito: 2, id_caso: 1, fecha: "2025-04-02", desc: "Reunión con madre. Compromisos firmados. Se deriva a orientación.", documentos: [] },
      { id_hito: 3, id_caso: 1, fecha: "2025-04-10", desc: "Alumna derivada a psicólogo externo. Informe en espera.", documentos: [] },
    ],
  },
  {
    id_caso: 2,
    id_coordinador: "coord-001",
    estado: "en proceso",
    fecha_inicio: "2025-03-10",
    fecha_cierre: null,
    desc: "Alumno registra múltiples anotaciones de conducta y daños a dependencias del colegio.",
    gravedad: "alta",
    estudiantes: [
      { id_estudiante: "21.678.901-2", nombre: "Sebastián Muñoz Torres", nombre_curso: "2°B" },
    ],
    hitos: [
      { id_hito: 4, id_caso: 2, fecha: "2025-03-10", desc: "Se abre caso por acumulación de incidentes. Citación a apoderado.", documentos: [{ id_doc: 2, nombre_original: "acta_apertura.pdf", mime_type: "application/pdf" }] },
      { id_hito: 5, id_caso: 2, fecha: "2025-03-20", desc: "Suspensión 2 días. Firma de compromiso al reintegrarse.", documentos: [{ id_doc: 3, nombre_original: "resolucion_suspension.pdf", mime_type: "application/pdf" }] },
    ],
  },
  {
    id_caso: 3,
    id_coordinador: "coord-001",
    estado: "en proceso",
    fecha_inicio: "2025-03-15",
    fecha_cierre: null,
    desc: "Protocolo de acoso escolar activado. Involucra a 3 alumnos.",
    gravedad: "alta",
    estudiantes: [
      { id_estudiante: "21.890.123-4", nombre: "Diego Herrera Lagos", nombre_curso: "1°C" },
      { id_estudiante: "21.901.234-5", nombre: "Felipe Araya Ramos", nombre_curso: "1°C" },
    ],
    hitos: [
      { id_hito: 6, id_caso: 3, fecha: "2025-03-15", desc: "Se activa protocolo bullying conforme al reglamento capítulo V.", documentos: [{ id_doc: 4, nombre_original: "protocolo_bullying_001.pdf", mime_type: "application/pdf" }] },
      { id_hito: 7, id_caso: 3, fecha: "2025-03-18", desc: "Entrevistas a todos los involucrados y testigos.", documentos: [{ id_doc: 5, nombre_original: "actas_entrevistas.pdf", mime_type: "application/pdf" }] },
      { id_hito: 8, id_caso: 3, fecha: "2025-03-25", desc: "Plan de trabajo con psicóloga y mediación grupal iniciada.", documentos: [] },
    ],
  },
  {
    id_caso: 4,
    id_coordinador: "coord-001",
    estado: "cerrado",
    fecha_inicio: "2025-01-10",
    fecha_cierre: "2025-02-28",
    desc: "Alumna presentó conducta disruptiva reiterada en clases. Caso resuelto con plan de apoyo.",
    gravedad: "baja",
    estudiantes: [
      { id_estudiante: "21.789.012-3", nombre: "Catalina Vega Morales", nombre_curso: "2°B" },
    ],
    hitos: [
      { id_hito: 9, id_caso: 4, fecha: "2025-01-10", desc: "Apertura del caso por conducta reiterada.", documentos: [] },
      { id_hito: 10, id_caso: 4, fecha: "2025-02-01", desc: "Plan de apoyo pedagógico implementado.", documentos: [] },
      { id_hito: 11, id_caso: 4, fecha: "2025-02-28", desc: "Mejora sostenida. Se cierra el caso.", documentos: [] },
    ],
  },
];

export const CASE_FILTER_OPTIONS = {
  estados: ["todos", "abierto", "en proceso", "cerrado"],
  gravedades: ["todas", "baja", "media", "alta"],
  cursos: ["todos", "1°C", "2°B", "3°A", "4°D"],
};

export const CASE_INITIAL_FILTERS = {
  search: "",
  estado: "todos",
  gravedad: "todas",
  curso: "todos",
};