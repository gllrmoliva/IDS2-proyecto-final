-- ==============================================================================
-- Seed Data: test_data.sql
-- Descripción: Datos de testeo con resolución de tipos e integridad referencial
-- ==============================================================================

-- 1. IDENTIDADES (Usuario)
INSERT INTO "Usuario" ("id_usuario", "nombre", "email", "tipo_usuario", "es_activo", "hashed_password") VALUES
('11111111-1', 'Ana Silva', 'ana.silva@colegio.cl', 'coordinador', true, '$argon2id$v=19$m=65536,t=3,p=4$v3g6v5o560tjei3d67pLsQ$vOG7SLI/xcihRYXn22f7YP0W1WbKNiEtmK9Y7b/ICcs'), -- testpassword
('22222222-2', 'Carlos Sanhueza', 'carlos.insp@colegio.cl', 'productor', true, '$argon2id$v=19$m=65536,t=3,p=4$BflesKr+5JiHE5V+bRbFqA$2mezGOPsMDqHO16+DSVuUB58rK2IH46fdRVozwspmwk'), -- testpassword1
('33333333-3', 'Roberto Delgado', 'roberto.insp@colegio.cl', 'productor', true, '$argon2id$v=19$m=65536,t=3,p=4$FyiE2qJzZT1ZpHoTEYJGMA$3dsMiTCWLpacLN8kjenmWs3etybelYO1Pw4m0zfm5Hk'), -- testpassword2
('44444444-4', 'María Hernández', 'maria.prof@colegio.cl', 'profesor_jefe', true, '$argon2id$v=19$m=65536,t=3,p=4$UzwZMput7ak/9hFKEl+5Kw$XnnDqt1P9maO8I1p+EX9EuQyhs76Lta4Hou04TjoXOM'), -- testpassword3
('55555555-5', 'Usuario Eliminado', 'borrado@colegio.cl', 'productor', false, '$argon2id$v=19$m=65536,t=3,p=4$K03wg1do6eLZ9TvNPIChLg$ezRhAEPXdpPd5DuCO3NQnoL5wdZzG7H5IXWmREFauRk'); -- nosGustaMucho

-- 2. TPT SUBCLASSES (Domain Roles)
INSERT INTO "Coordinador" ("id_usuario") VALUES ('11111111-1');

INSERT INTO "Productor" ("id_usuario") VALUES 
('22222222-2'), 
('33333333-3'), 
('44444444-4'), 
('55555555-5');

INSERT INTO "ProfesorJefe" ("id_usuario") VALUES ('44444444-4');

-- 3. CORE DOMAIN ENTITIES
INSERT INTO "Curso" ("id_curso", "nombre_curso", "id_pj") VALUES
(1, '1 Medio A', '44444444-4');

INSERT INTO "Estudiante" ("id_estudiante", "nombre", "id_curso") VALUES
('1000000-1', 'Juan Pérez', 1),
('1000001-2', 'Pedro Gómez', 1),
('1000003-3', 'Diego López', 1);

-- Casos (Se ajusta gravedad a la nueva nomenclatura y se añade categoría)
INSERT INTO "Caso" ("id_caso", "id_coordinador", "estado", "fecha_inicio", "fecha_cierre", "desc", "gravedad", "categoria") VALUES
(1, '11111111-1', 'abierto', '2026-05-10', NULL, 'Problemas reiterados de convivencia en sala.', 'grave', 'disrupcion_desacato'),
(2, '11111111-1', 'cerrado', '2026-04-01', '2026-04-15', 'Daño a propiedad del colegio (ventanal).', 'muy_grave', 'dano_infraestructura_bienes');

-- Hitos (Se añade tipo de hito y nivel de medida)
INSERT INTO "Hito" ("id_hito", "id_caso", "tipo", "nivel_medida", "desc", "fecha") VALUES
(1, 1, 'tramite', NULL, 'Entrevista inicial con apoderados de Juanito.', '2026-05-12'),
(2, 1, 'tramite', NULL, 'Derivación a convivencia escolar.', '2026-05-15'),
(3, 2, 'medida', 'disciplinaria_n2', 'Cierre del caso con carta de compromiso.', '2026-04-15');

-- Incidentes 
INSERT INTO "Incidente" ("id_incidente", "id_productor", "gravedad", "categoria", "desc", "id_caso", "id_caso_acumulado", "estado", "motivo_rechazo", "fecha") VALUES
(1, '22222222-2', 'leve', 'violencia_fisica', 'Pelea menor en el patio durante el recreo.', 1, NULL, 'aceptado', NULL, '2025-05-10'),            -- Elevado como Evento Originario
(2, '33333333-3', 'grave', 'disrupcion_desacato', 'Falta de respeto grave a la profesora durante clase.', NULL, 1, 'aceptado', NULL, '2025-05-11'), -- Anexado como Acumulación/Reincidencia
(3, '22222222-2', 'muy_grave', 'dano_infraestructura_bienes', 'Alumno rompió el ventanal con un balón.', 2, NULL, 'aceptado', NULL, '2025-05-10'),  -- Elevado como Evento Originario
(4, '22222222-2', 'leve', 'violencia_fisica', 'Alumno empujó a su compañero del primer piso.', NULL, NULL, 'rechazado', 'Falta de pruebas', '2025-05-10'); -- Rechazado y no elevado

-- Documentos
INSERT INTO "Documento" ("id_doc", "bucket_name", "object_key", "nombre_original", "mime_type", "size_bytes", "descripcion", "id_hito", "id_incidente", "id_caso") VALUES
(1, 'casos-docs', '2026/05/uuid-1234-5678.pdf', 'acta_entrevista.pdf', 'application/pdf', 1048576, 'Acta firmada por apoderado', 1, NULL, NULL),
(2, 'incidentes-docs', '2026/05/uuid-abcd-efgh.jpg', 'foto_pizarra.jpg', 'image/jpeg', 2048000, 'Foto de la evidencia en clase', 1, NULL, NULL);

-- (Mappings M:N)

-- Estudiante_Caso (Se asignan roles definitivos de la investigación)
INSERT INTO "Estudiante_Caso" ("id_estudiante", "id_caso", "rol") VALUES
('1000000-1', 1, 'autor_agresor'),
('1000001-2', 1, 'complice'),
('1000003-3', 1, 'testigo_espectador'),
('1000000-1', 2, 'autor_agresor');

-- Estudiante_Incidente (Se asignan roles provisionales del evento)
INSERT INTO "Estudiante_Incidente" ("id_estudiante", "id_incidente", "rol") VALUES
('1000000-1', 1, 'autor_agresor'),
('1000001-2', 1, 'afectado_victima'),
('1000003-3', 2, 'autor_agresor'),
('1000000-1', 3, 'autor_agresor'),
('1000000-1', 4, 'autor_agresor');

-- Estudiante_Hito (Targeting de quién es sujeto de la acción/medida)
INSERT INTO "Estudiante_Hito" ("id_estudiante", "id_hito") VALUES
('1000000-1', 1), -- Juanito es el objetivo de la entrevista
('1000003-3', 1), -- Diego también asiste a la entrevista
('1000000-1', 2), -- Juanito es el derivado a convivencia
('1000001-2', 2), -- Pedrito también es derivado
('1000000-1', 3); -- Juanito es el objetivo de la medida disciplinaria (Carta)
