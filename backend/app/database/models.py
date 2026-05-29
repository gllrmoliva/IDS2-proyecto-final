import enum
from datetime import date
from typing import List, Optional
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Date,
    Text,
    BigInteger,
    ForeignKey,
    CheckConstraint,
    Index,
    Table,
    Column,
    Enum
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


####################
# ENUMERADORES
####################

class EstadoCaso(str, enum.Enum):
    abierto = "abierto"
    cerrado = "cerrado"

class Gravedad(str, enum.Enum):
    leve = "leve"
    grave = "grave"
    muy_grave = "muy_grave"

class EstadoIncidente(str, enum.Enum):
    aceptado = "aceptado"
    pendiente = "pendiente"
    rechazado = "rechazado"

class TipoHito(str, enum.Enum):
    tramite = "tramite"
    medida = "medida"

class NivelMedida(str, enum.Enum):
    cautelar = "cautelar"
    formativa_n1 = "formativa_n1"
    disciplinaria_n2 = "disciplinaria_n2"
    excepcional_n3 = "excepcional_n3"

class RolInvolucrado(str, enum.Enum):
    afectado_victima = "afectado_victima"
    autor_agresor = "autor_agresor"
    complice = "complice"
    testigo_espectador = "testigo_espectador"

class CategoriaConvivencia(str, enum.Enum):
    violencia_fisica = "violencia_fisica"
    violencia_psicologica_acoso = "violencia_psicologica_acoso"
    disrupcion_desacato = "disrupcion_desacato"
    probidad_fraude = "probidad_fraude"
    dano_infraestructura_bienes = "dano_infraestructura_bienes"
    conductas_riesgo_sustancias = "conductas_riesgo_sustancias"
    privacidad_tecnologia = "privacidad_tecnologia"
    sexualidad_obscenidad = "sexualidad_obscenidad"
    valores_institucionales = "valores_institucionales"
    otro = "otro"


####################
# RELACIONES SECUNDARIAS (Sólo sin payload extra)
####################

estudiante_hito = Table(
    "Estudiante_Hito",
    Base.metadata,
    Column(
        "id_estudiante",
        String,
        ForeignKey(
            "Estudiante.id_estudiante",
            ondelete="CASCADE",
            deferrable=True,
            initially="IMMEDIATE",
        ),
        primary_key=True,
    ),
    Column(
        "id_hito",
        Integer,
        ForeignKey(
            "Hito.id_hito", ondelete="CASCADE", deferrable=True, initially="IMMEDIATE"
        ),
        primary_key=True,
    ),
)


####################
# ASSOCIATION OBJECTS (Para relaciones con Rol)
####################

class EstudianteCaso(Base):
    __tablename__ = "Estudiante_Caso"
    id_estudiante: Mapped[str] = mapped_column(
        ForeignKey("Estudiante.id_estudiante", ondelete="CASCADE", deferrable=True, initially="IMMEDIATE"), 
        primary_key=True
    )
    id_caso: Mapped[int] = mapped_column(
        ForeignKey("Caso.id_caso", ondelete="CASCADE", deferrable=True, initially="IMMEDIATE"), 
        primary_key=True
    )
    rol: Mapped[Optional[RolInvolucrado]] = mapped_column()

    estudiante: Mapped["Estudiante"] = relationship(back_populates="casos")
    caso: Mapped["Caso"] = relationship(back_populates="estudiantes")


class EstudianteIncidente(Base):
    __tablename__ = "Estudiante_Incidente"
    id_estudiante: Mapped[str] = mapped_column(
        ForeignKey("Estudiante.id_estudiante", ondelete="CASCADE", deferrable=True, initially="IMMEDIATE"), 
        primary_key=True
    )
    id_incidente: Mapped[int] = mapped_column(
        ForeignKey("Incidente.id_incidente", ondelete="CASCADE", deferrable=True, initially="IMMEDIATE"), 
        primary_key=True
    )
    rol: Mapped[Optional[RolInvolucrado]] = mapped_column()

    estudiante: Mapped["Estudiante"] = relationship(back_populates="incidentes")
    incidente: Mapped["Incidente"] = relationship(back_populates="estudiantes")



####################
# USUARIOS
####################

class Usuario(Base):
    __tablename__ = "Usuario"

    id_usuario: Mapped[str] = mapped_column(String, primary_key=True)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    tipo_usuario: Mapped[str] = mapped_column(String, nullable=False)
    es_activo: Mapped[bool] = mapped_column(Boolean, server_default="true")
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "tipo_usuario IN ('coordinador', 'productor', 'profesor_jefe')",
            name="chk_tipo_usuario",
        ),
        Index(
            "unique_email_active_users",
            "email",
            unique=True,
            postgresql_where="es_activo = true",
        ),
    )

    __mapper_args__ = {
        "polymorphic_on": "tipo_usuario",
        "polymorphic_identity": "usuario",
    }


class Coordinador(Usuario):
    __tablename__ = "Coordinador"
    id_usuario: Mapped[str] = mapped_column(
        String,
        ForeignKey(
            "Usuario.id_usuario",
            ondelete="CASCADE",
            deferrable=True,
            initially="IMMEDIATE",
        ),
        primary_key=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": "coordinador",
    }


class Productor(Usuario):
    __tablename__ = "Productor"
    id_usuario: Mapped[str] = mapped_column(
        String,
        ForeignKey(
            "Usuario.id_usuario",
            ondelete="CASCADE",
            deferrable=True,
            initially="IMMEDIATE",
        ),
        primary_key=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": "productor",
    }


class ProfesorJefe(Productor):
    __tablename__ = "ProfesorJefe"
    id_usuario: Mapped[str] = mapped_column(
        String,
        ForeignKey(
            "Productor.id_usuario",
            ondelete="CASCADE",
            deferrable=True,
            initially="IMMEDIATE",
        ),
        primary_key=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": "profesor_jefe",
    }


####################
# SISTEMA CURRICULAR
####################

class Curso(Base):
    __tablename__ = "Curso"

    id_curso: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre_curso: Mapped[str] = mapped_column(String, nullable=False)
    id_pj: Mapped[str] = mapped_column(
        String,
        ForeignKey("ProfesorJefe.id_usuario", deferrable=True, initially="IMMEDIATE"),
        unique=True,
        nullable=False,
    )

    estudiantes: Mapped[List["Estudiante"]] = relationship(back_populates="curso")


class Estudiante(Base):
    __tablename__ = "Estudiante"

    id_estudiante: Mapped[str] = mapped_column(String, primary_key=True)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    id_curso: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey(
            "Curso.id_curso",
            ondelete="SET NULL",
            deferrable=True,
            initially="IMMEDIATE",
        ),
    )

    curso: Mapped[Optional["Curso"]] = relationship(back_populates="estudiantes")
    
    casos: Mapped[List["EstudianteCaso"]] = relationship(back_populates="estudiante", cascade="all, delete-orphan")
    incidentes: Mapped[List["EstudianteIncidente"]] = relationship(back_populates="estudiante", cascade="all, delete-orphan")
    
    hitos: Mapped[List["Hito"]] = relationship(
        secondary=estudiante_hito, back_populates="estudiantes"
    )


####################
# GESTIÓN CASOS
####################

class Caso(Base):
    __tablename__ = "Caso"

    id_caso: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_coordinador: Mapped[str] = mapped_column(
        String,
        ForeignKey("Coordinador.id_usuario", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    estado: Mapped[EstadoCaso] = mapped_column(nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_cierre: Mapped[Optional[date]] = mapped_column(Date)
    desc: Mapped[str] = mapped_column(Text, nullable=False)
    gravedad: Mapped[Gravedad] = mapped_column(nullable=False)
    categoria: Mapped[CategoriaConvivencia] = mapped_column(nullable=False)

    estudiantes: Mapped[List["EstudianteCaso"]] = relationship(
        back_populates="caso", cascade="all, delete-orphan"
    )
    hitos: Mapped[List["Hito"]] = relationship(
        back_populates="caso", cascade="all, delete-orphan"
    )
    
    # Relación inversa explícita para la navegación de la reincidencia/acumulación (opcional pero útil)
    incidentes_acumulados: Mapped[List["Incidente"]] = relationship(
        "Incidente", 
        foreign_keys="[Incidente.id_caso_acumulado]", 
        back_populates="caso_acumulado"
    )


class Hito(Base):
    __tablename__ = "Hito"

    id_hito: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_caso: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "Caso.id_caso", ondelete="CASCADE", deferrable=True, initially="IMMEDIATE"
        ),
        nullable=False,
    )
    tipo: Mapped[TipoHito] = mapped_column(nullable=False)
    nivel_medida: Mapped[Optional[NivelMedida]] = mapped_column()
    desc: Mapped[str] = mapped_column(Text, nullable=False)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "(tipo = 'medida'::tipo_hito AND nivel_medida IS NOT NULL) OR (tipo = 'tramite'::tipo_hito AND nivel_medida IS NULL)",
            name="chk_hito_medida_nivel",
        ),
    )

    caso: Mapped["Caso"] = relationship(back_populates="hitos")
    estudiantes: Mapped[List["Estudiante"]] = relationship(
        secondary=estudiante_hito, back_populates="hitos"
    )
    documentos: Mapped[List["Documento"]] = relationship()


class Incidente(Base):
    __tablename__ = "Incidente"

    id_incidente: Mapped[int] = mapped_column(Integer, primary_key=True,
                                              autoincrement=True)
    id_productor: Mapped[str] = mapped_column(
        String,
        ForeignKey("Productor.id_usuario", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    gravedad: Mapped[Gravedad] = mapped_column(nullable=False)
    desc: Mapped[str] = mapped_column(Text, nullable=False)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    categoria: Mapped[CategoriaConvivencia] = mapped_column(nullable=False)

    id_caso: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("Caso.id_caso", deferrable=True, initially="IMMEDIATE"),
        unique=True,
    )
    id_caso_acumulado: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("Caso.id_caso", deferrable=True, initially="IMMEDIATE"),
    )

    estado: Mapped[EstadoIncidente] = mapped_column(
        Enum(EstadoIncidente, name="estado_incidente", create_type=True),
        nullable=False
    )
    motivo_rechazo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "id_caso IS NULL OR id_caso_acumulado IS NULL", 
            name="mutualmente_exclusivo_ruta"
        ),
        CheckConstraint(
            "estado = 'aceptado'::estado_incidente OR (id_caso IS NULL AND id_caso_acumulado IS NULL)",
            name="estado_incidente_1",
        ),
        CheckConstraint(
            "estado != 'aceptado'::estado_incidente OR (id_caso IS NOT NULL OR id_caso_acumulado IS NOT NULL)",
            name="estado_incidente_2",
        ),
        CheckConstraint(
            "estado = 'rechazado'::estado_incidente OR motivo_rechazo IS NULL",
            name="motivo_rechazo_1",
        ),
        CheckConstraint(
            "estado != 'rechazado'::estado_incidente OR motivo_rechazo IS NOT NULL",
            name="motivo_rechazo_2",
        ),
    )

    estudiantes: Mapped[List["EstudianteIncidente"]] = relationship(
        back_populates="incidente", cascade="all, delete-orphan"
    )
    documentos: Mapped[List["Documento"]] = relationship()
    productor: Mapped["Productor"] = relationship("Productor")
    
    caso_origen: Mapped[Optional["Caso"]] = relationship("Caso", foreign_keys=[id_caso])
    caso_acumulado: Mapped[Optional["Caso"]] = relationship("Caso", foreign_keys=[id_caso_acumulado], back_populates="incidentes_acumulados")


class Documento(Base):
    __tablename__ = "Documento"

    id_doc: Mapped[int] = mapped_column(Integer, primary_key=True)
    bucket_name: Mapped[str] = mapped_column(
        String, nullable=False, comment="Ej: 'evidencias', 'documentos'"
    )
    object_key: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        comment="El UUID o path en MinIO, ej: '2026/05/uuid.pdf'",
    )
    nombre_original: Mapped[str] = mapped_column(
        String, nullable=False, comment="Ej: 'informe_final.docx'"
    )
    mime_type: Mapped[str] = mapped_column(
        String, nullable=False, comment="Ej: 'application/pdf'"
    )
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)

    id_hito: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("Hito.id_hito", deferrable=True, initially="IMMEDIATE"),
        nullable=True,
    )

    id_incidente: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("Incidente.id_incidente", deferrable=True, initially="IMMEDIATE"),
        nullable=True,
    )

    __table_args__ = (
        CheckConstraint(
            "id_hito IS NOT NULL OR id_incidente IS NOT NULL",
            name="chk_documento_origen_obligatorio",
        ),
    )
