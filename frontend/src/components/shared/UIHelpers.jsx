// Sección con título y contenido con fondo gris
export function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</h3>
      <div className="bg-gray-50 rounded-xl p-4">{children}</div>
    </div>
  );
}
 
// Fila de dato: etiqueta a la izquierda, valor a la derecha
export function DataRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1 text-sm border-b border-gray-100 last:border-0">
      <span className="text-gray-500 font-medium flex-shrink-0">{label}</span>
      <span className="text-gray-800 text-right">{value}</span>
    </div>
  );
}
 
// Grupo de formulario: label + input/select/textarea
export function FormGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
