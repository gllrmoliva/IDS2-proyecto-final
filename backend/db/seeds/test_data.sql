-- ==============================================================================
-- Seed Data: test_data.sql
-- Descripción: Datos de testeo con resolución de tipos e integridad referencial
-- ==============================================================================

-- 1. IDENTIDADES (Usuario)
INSERT INTO "Usuario" ("id_usuario", "nombre", "email", "tipo_usuario", "es_activo") VALUES
('11111111-1', 'Ana Silva (Coordinadora)', 'ana.silva@colegio.cl', 'coordinador', true),
('22222222-2', 'Carlos Inspector (Productor)', 'carlos.insp@colegio.cl', 'productor', true),
('33333333-3', 'Roberto Profesor Inspector (Productor)', 'roberto.insp@colegio.cl', 'productor', true),
('44444444-4', 'María Profesora (Profesor Jefe)', 'maria.prof@colegio.cl', 'profesor_jefe', true),
('55555555-5', 'Usuario Eliminado', 'borrado@colegio.cl', 'productor', false);

-- 2. TPT SUBCLASSES (Domain Roles)
-- Coordinador
INSERT INTO "Coordinador" ("id_usuario") VALUES ('11111111-1');

-- Productores (Todo Profesor Jefe también debe insertarse aquí)
INSERT INTO "Productor" ("id_usuario") VALUES 
('22222222-2'), 
('33333333-3'), 
('44444444-4'), 
('55555555-5');

-- Profesor Jefe (Asociado explícitamente a María)
INSERT INTO "ProfesorJefe" ("id_usuario") VALUES ('44444444-4');

-- 3. CORE DOMAIN ENTITIES
-- Cursos (Apunta correctamente al ID de María)
INSERT INTO "Curso" ("id_curso", "nombre_curso", "id_pj") VALUES
(1, '1 Medio A', '44444444-4');

-- Estudiantes (Formatos RUT aplicados correctamente como strings)
INSERT INTO "Estudiante" ("id_estudiante", "nombre", "id_curso") VALUES
('1000000-1', 'Juanito Pérez', 1),
('1000001-2', 'Pedrito Gómez', 1),
('1000003-3', 'Diego López', 1);

-- Casos
INSERT INTO "Caso" ("id_caso", "id_coordinador", "estado", "fecha_inicio", "fecha_cierre", "desc", "gravedad") VALUES
(1, '11111111-1', 'abierto', '2026-05-10', NULL, 'Problemas reiterados de convivencia en sala.', 'media'),
(2, '11111111-1', 'cerrado', '2026-04-01', '2026-04-15', 'Daño a propiedad del colegio (ventanal).', 'alta');

-- Hitos
INSERT INTO "Hito" ("id_hito", "id_caso", "desc", "fecha") VALUES
(1, 1, 'Entrevista inicial con apoderados de Juanito.', '2026-05-12'),
(2, 1, 'Derivación a convivencia escolar.', '2026-05-15'),
(3, 2, 'Cierre del caso con carta de compromiso.', '2026-04-15');

-- Incidentes (Testing de XOR constraint)
INSERT INTO "Incidente" ("id_incidente", "id_productor", "gravedad", "desc", "id_caso", "id_hito", "estado", "motivo_rechazo", "fecha") VALUES
(1, '22222222-2', 'baja', 'Pelea menor en el patio durante el recreo.', 1, NULL, 'aceptado', NULL, '2025-05-10'),            -- Asociado a Caso
(2, '33333333-3', 'media', 'Falta de respeto grave a la profesora durante clase.', NULL, 1, 'aceptado', NULL, '2025-05-10'), -- Asociado a Hito
(3, '22222222-2', 'alta', 'Alumno rompió el ventanal con un balón.', 2, NULL, 'aceptado', NULL), '2025-05-10',               -- Asociado a Caso
(4, '22222222-2', 'baja', 'Alumno empujó a su compañero del primer piso.', NULL, NULL, 'rechazado', 'Ridículo', '2025-05-10');      -- No elevado

-- Documentos (Simulating MinIO metadata)
INSERT INTO "Documento" ("id_doc", "bucket_name", "object_key", "nombre_original", "mime_type", "size_bytes", "descripcion", "id_hito", "id_incidente") VALUES
(1, 'casos-docs', '2026/05/uuid-1234-5678.pdf', 'acta_entrevista.pdf', 'application/pdf', 1048576, 'Acta firmada por apoderado', 1, NULL),
(2, 'incidentes-docs', '2026/05/uuid-abcd-efgh.jpg', 'foto_pizarra.jpg', 'image/jpeg', 2048000, 'Foto de la evidencia en clase', 1, 2);

-- 4. ASSOCIATIVE ENTITIES (M:N Mappings)

-- Estudiantes involucrados en los casos
INSERT INTO "Estudiante_Caso" ("id_estudiante", "id_caso") VALUES
('1000000-1', 1),
('1000001-2', 1),
('1000003-3', 1),
('1000000-1', 2);

-- Estudiantes involucrados en los incidentes
INSERT INTO "Estudiante_Incidente" ("id_estudiante", "id_incidente") VALUES
('1000000-1', 1),
('1000001-2', 1),
('1000003-3', 2),
('1000000-1', 3),
('1000000-1', 4);

-- Estudiantes asociados a hitos específicos (ej. citados a la entrevista)
INSERT INTO "Estudiante_Hito" ("id_estudiante", "id_hito") VALUES
('1000000-1', 1),
('1000003-3', 1),
('1000000-1', 2),
('1000001-2', 2),
('1000000-1', 3);
