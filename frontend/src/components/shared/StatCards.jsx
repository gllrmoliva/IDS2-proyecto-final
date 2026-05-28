// StatCard.jsx
// Card de estadística reutilizable en las vistas de monitoreo.
// Props: label, value, color, bg, border

export function StatCard({ label, value, color, bg, border }) {
  return (
    <div className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
      <div className={`text-4xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1 font-semibold">{label}</div>
    </div>
  );
}