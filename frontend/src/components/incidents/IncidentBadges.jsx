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

export function GravedadBadge({ gravedad }) { // Clases de color según nivel de gravedad
  const map = {
    "leve":      "bg-blue-100 border border-blue-200",
    "grave":     "bg-orange-100  border border-orange-200",
    "muy_grave":      "bg-red-100  border border-red-200",
  };

  const label = {  // Texto visible en el badge
    "leve": "Baja",
    "grave": "Media",
    "muy_grave": "Alta",
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-gray-800 ${map[gravedad] ?? "bg-gray-100 text-gray-600"}`}>
      {label[gravedad] ?? gravedad}
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
