// dateUtils.js
// Utilidades de fecha para formato de uso no gringo (dd/mm/yyyy)

// Convierte "2025-04-15" a "15/04/2025"
export function formatFecha(fechaISO) {
  if (!fechaISO) return "—";
  const [y, m, d] = fechaISO.split("-");
  return `${d}/${m}/${y}`;
}