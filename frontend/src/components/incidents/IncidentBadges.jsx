// IncidentBadges.jsx
//
// Badges visuales reutilizables para mostrar el estado y la gravedad de un
// incidente. Se usan tanto en la tabla "IncidentTable" como en el modal de
// detalle "IncidentDetailModal".
//
// Props:
//   GravedadBadge = gravedad: "baja" | "media" | "alta"
//   EstadoBadge   = estado:   "pendiente" | "aprobado" | "rechazado"
//
// Para agregar un nuevo valor, se añade en los objetos "map" y "label". (aunque dudo que agreguemos otros)

const GRAVEDAD_MAP = {
  baja: "bg-blue-100 border border-blue-200",   leve: "bg-blue-100 border border-blue-200",
  media: "bg-orange-100 border border-orange-200", grave: "bg-orange-100 border border-orange-200",
  alta: "bg-red-100 border border-red-200",     muy_grave: "bg-red-100 border border-red-200",
};
const GRAVEDAD_LABEL = {
  baja: "Baja", leve: "Baja",
  media: "Media", grave: "Media",
  alta: "Alta", muy_grave: "Alta",
};

export function GravedadBadge({ gravedad }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-gray-800 ${GRAVEDAD_MAP[gravedad] ?? "bg-gray-100 text-gray-600"}`}>
      {GRAVEDAD_LABEL[gravedad] ?? gravedad}
    </span>
  );
}
 
export function EstadoBadge({ estado }) {
  const map = {
    "pendiente": "bg-yellow-100  border border-yellow-200",
    "aprobado":  "bg-green-100  border border-green-200",
    "rechazado": "bg-red-100  border border-red-200",
  };

  const label = {
    "pendiente": "Pendiente",
    "aprobado":  "Aprobado",
    "rechazado": "Rechazado",
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-gray-800  ${map[estado] ?? "bg-gray-100 text-gray-600"}`}>
      {label[estado] ?? estado}
    </span>
  );
}