// CaseBadges.jsx
// Badges visuales reutilizables para estado y gravedad de casos.
// Se usan en CaseMonitorView y en el futuro CaseDetailModal.
//
// Props:
//   EstadoCasoBadge = estado:   "abierto" | "abierto" | "cerrado"
//   GravedadCasoBadge = gravedad: "baja" | "media" | "alta"

export function EstadoCasoBadge({ estado }) {
    const map = {
    "abierto":  "bg-blue-100 border border-blue-200",
    "cerrado": "bg-green-100 border border-green-200",
  };
    const label = {  // Texto visible en el badge
    "abierto": "Abierto",
    "cerrado": "Cerrado",
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[estado] ?? "bg-gray-100 text-gray-600"}`}>
    {label[estado] ?? estado}
    </span>
  );
}

const GRAVEDAD_CASO_MAP = {
  baja: "bg-blue-100 border border-blue-200",   leve: "bg-blue-100 border border-blue-200",
  media: "bg-orange-100 border border-orange-200", grave: "bg-orange-100 border border-orange-200",
  alta: "bg-red-100 border border-red-200",     muy_grave: "bg-red-100 border border-red-200",
};
const GRAVEDAD_CASO_LABEL = {
  baja: "Baja", leve: "Baja",
  media: "Media", grave: "Media",
  alta: "Alta", muy_grave: "Alta",
};

export function GravedadCasoBadge({ gravedad }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${GRAVEDAD_CASO_MAP[gravedad] ?? "bg-gray-100 text-gray-600"}`}>
      {GRAVEDAD_CASO_LABEL[gravedad] ?? gravedad}
    </span>
  );
}