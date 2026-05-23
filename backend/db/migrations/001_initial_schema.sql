CREATE TYPE "estado_caso" AS ENUM (
  'abierto',
  'en proceso',
  'cerrado'
);

CREATE TYPE "estado_incidente" AS ENUM (
  'aceptado',
  'pendiente',
  'rechazado'
);


CREATE TYPE "gravedad" AS ENUM (
  'baja',
  'media',
  'alta'
);

CREATE TABLE "Usuario" (
  "id_usuario" varchar PRIMARY KEY,
  "nombre" varchar NOT NULL,
  "email" varchar NOT NULL, 
  "tipo_usuario" varchar NOT NULL,
  "es_activo" boolean DEFAULT true,
  CHECK (tipo_usuario IN ('coordinador', 'productor', 'profesor_jefe'))
);
CREATE UNIQUE INDEX "unique_email_active_users" ON "Usuario" ("email") WHERE "es_activo" = true;

CREATE TABLE "Coordinador" (
  "id_usuario" varchar PRIMARY KEY
);

CREATE TABLE "Productor" (
  "id_usuario" varchar PRIMARY KEY
);

CREATE TABLE "ProfesorJefe" (
  "id_usuario" varchar PRIMARY KEY
);

CREATE TABLE "Estudiante" (
  "id_estudiante" varchar PRIMARY KEY, 
  "nombre" varchar NOT NULL,
  "id_curso" integer
);

CREATE TABLE "Curso" (
  "id_curso" integer PRIMARY KEY,
  "nombre_curso" varchar NOT NULL,
  "id_pj" varchar UNIQUE NOT NULL 
);

CREATE TABLE "Caso" (
  "id_caso" integer PRIMARY KEY,
  "id_coordinador" varchar NOT NULL,
  "estado" estado_caso NOT NULL,
  "fecha_inicio" date NOT NULL,
  "fecha_cierre" date,
  "desc" text NOT NULL,
  "gravedad" gravedad NOT NULL
);

CREATE TABLE "Hito" (
  "id_hito" integer PRIMARY KEY,
  "id_caso" integer NOT NULL,
  "desc" text NOT NULL,
  "fecha" date NOT NULL
);

CREATE TABLE "Incidente" (
  "id_incidente" integer PRIMARY KEY,
  "id_productor" varchar NOT NULL,
  "gravedad" gravedad NOT NULL,
  "desc" text NOT NULL,
  "id_caso" integer UNIQUE,
  "id_hito" integer UNIQUE,
  "estado" estado_incidente NOT NULL,
  "motivo_rechazo" varchar,
  CONSTRAINT "mutualmente_exclusivo" CHECK (id_caso IS NULL OR id_hito IS NULL),
  CONSTRAINT "estado_incidente_1"
  CHECK (estado = 'aceptado'::estado_incidente OR (id_caso is NULL AND id_hito is NULL)),
  CONSTRAINT "estado_incidente_2"
  CHECK (estado != 'aceptado'::estado_incidente OR (id_caso is not NULL OR id_hito is not NULL)),
  CONSTRAINT "motivo_rechazo_1"
  CHECK (estado = 'rechazado'::estado_incidente OR motivo_rechazo is NULL),
  CONSTRAINT "motivo_rechazo_2"
  CHECK (estado != 'rechazado'::estado_incidente OR motivo_rechazo is not NULL)
);

CREATE TABLE "Documento" (
  "id_doc" integer PRIMARY KEY,
  "bucket_name" varchar NOT NULL,
  "object_key" varchar UNIQUE NOT NULL,
  "nombre_original" varchar NOT NULL,
  "mime_type" varchar NOT NULL,
  "size_bytes" bigint NOT NULL,
  "descripcion" text NOT NULL,
  "id_hito" integer NOT NULL,
  "id_incidente" integer
);

CREATE TABLE "Estudiante_Caso" (
  "id_estudiante" varchar NOT NULL, -- Modificado a varchar
  "id_caso" integer NOT NULL,
  PRIMARY KEY ("id_estudiante", "id_caso")
);

CREATE TABLE "Estudiante_Incidente" (
  "id_estudiante" varchar NOT NULL, -- Modificado a varchar
  "id_incidente" integer NOT NULL,
  PRIMARY KEY ("id_estudiante", "id_incidente")
);

CREATE TABLE "Estudiante_Hito" (
  "id_estudiante" varchar NOT NULL, -- Modificado a varchar
  "id_hito" integer NOT NULL,
  PRIMARY KEY ("id_estudiante", "id_hito")
);

COMMENT ON COLUMN "Documento"."bucket_name" IS 'Ej: ''casos-docs'', ''incidentes-docs''';
COMMENT ON COLUMN "Documento"."object_key" IS 'El UUID o path en MinIO, ej: ''2026/05/uuid.pdf''';
COMMENT ON COLUMN "Documento"."nombre_original" IS 'Ej: ''informe_final.docx''';
COMMENT ON COLUMN "Documento"."mime_type" IS 'Ej: ''application/pdf''';

ALTER TABLE "Coordinador" ADD FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id_usuario") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Productor" ADD FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id_usuario") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "ProfesorJefe" ADD FOREIGN KEY ("id_usuario") REFERENCES "Productor" ("id_usuario") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Estudiante" ADD FOREIGN KEY ("id_curso") REFERENCES "Curso" ("id_curso") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Curso" ADD FOREIGN KEY ("id_pj") REFERENCES "ProfesorJefe" ("id_usuario") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Caso" ADD FOREIGN KEY ("id_coordinador") REFERENCES "Coordinador" ("id_usuario") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Hito" ADD FOREIGN KEY ("id_caso") REFERENCES "Caso" ("id_caso") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Incidente" ADD FOREIGN KEY ("id_productor") REFERENCES "Productor" ("id_usuario") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Incidente" ADD FOREIGN KEY ("id_caso") REFERENCES "Caso" ("id_caso") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Incidente" ADD FOREIGN KEY ("id_hito") REFERENCES "Hito" ("id_hito") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Documento" ADD FOREIGN KEY ("id_hito") REFERENCES "Hito" ("id_hito") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Documento" ADD FOREIGN KEY ("id_incidente") REFERENCES "Incidente" ("id_incidente") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Estudiante_Caso" ADD FOREIGN KEY ("id_estudiante") REFERENCES "Estudiante" ("id_estudiante") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Estudiante_Caso" ADD FOREIGN KEY ("id_caso") REFERENCES "Caso" ("id_caso") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Estudiante_Incidente" ADD FOREIGN KEY ("id_estudiante") REFERENCES "Estudiante" ("id_estudiante") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Estudiante_Incidente" ADD FOREIGN KEY ("id_incidente") REFERENCES "Incidente" ("id_incidente") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Estudiante_Hito" ADD FOREIGN KEY ("id_estudiante") REFERENCES "Estudiante" ("id_estudiante") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "Estudiante_Hito" ADD FOREIGN KEY ("id_hito") REFERENCES "Hito" ("id_hito") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
