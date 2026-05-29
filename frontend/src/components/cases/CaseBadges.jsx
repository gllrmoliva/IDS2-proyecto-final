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

export function GravedadCasoBadge({ gravedad }) {
  const map = {
    "leve":  "bg-blue-100 border border-blue-200",
    "grave": "bg-orange-100  border border-orange-200",
    "muy_grave":  "bg-red-100  border border-red-200",
  };

  const label = {  // Texto visible en el badge
    "leve": "Baja",
    "grave": "Media",
    "muy_grave": "Alta",
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[gravedad] ?? "bg-gray-100 text-gray-600"}`}>
      {label[gravedad] ?? gravedad}
    </span>
  );
}