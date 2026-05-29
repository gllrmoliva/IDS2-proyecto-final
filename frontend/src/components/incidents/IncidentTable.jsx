// IncidentTable.jsx
// Tabla de incidentes. Cada fila es clickeable para ver el detalle.

import { GravedadBadge, EstadoBadge } from "./IncidentBadges";
import { formatFecha } from "../../utils/dateUtils";

const LABEL_CATEGORIA = {
  violencia_fisica: "Violencia física",
  violencia_psicologica_acoso: "Violencia psicológica / Acoso",
  disrupcion_desacato: "Disrupción / Desacato",
  probidad_fraude: "Probidad / Fraude",
  dano_infraestructura_bienes: "Daño a infraestructura o bienes",
  conductas_riesgo_sustancias: "Conductas de riesgo / Sustancias",
  privacidad_tecnologia: "Privacidad / Tecnología",
  sexualidad_obscenidad: "Sexualidad / Obscenidad",
  valores_institucionales: "Valores institucionales",
  otro: "Otro",
};
const labelTipo = (inc) =>
  LABEL_CATEGORIA[inc.categoria] ?? inc.tipo ?? "—";


// incidents: array de incidentes a mostrar (ya filtrados)
// onSelect: función que se llama al hacer click en un incidente, recibe el objeto incidente completo
export function IncidentTable({ incidents, onSelect }) { 
  if (incidents.length === 0) { // Estado vacío cuando no hay incidentes o no coinciden con los filtros
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3"></div>
        <p className="font-semibold">No se encontraron incidentes con los filtros aplicados.</p>
      </div>
    );
  }

  return ( // retorna la tabla con los incidentes filtrados
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-blue-900 text-white text-xs uppercase tracking-wide">
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Fecha</th>
            <th className="px-4 py-3 text-left">Alumno</th>
            <th className="px-4 py-3 text-left">Tipo</th>
            <th className="px-4 py-3 text-left">Gravedad</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-left">Reportado por</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {incidents.map((inc) => (
            <tr
              key={inc.id}
              onClick={() => onSelect(inc)}
              className="hover:bg-blue-50 cursor-pointer transition-colors group"
            >
              <td className="px-4 py-3 font-bold text-blue-700 group-hover:text-blue-900">
                {inc.id}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatFecha(inc.fecha)}</td>
              <td className="px-4 py-3">
                <span className="font-medium text-gray-800">{inc.alumno.nombre}</span>
                <br />
                <span className="text-xs text-gray-400">{inc.alumno.curso}</span>
              </td>
              <td className="px-4 py-3 text-gray-700">{labelTipo(inc)}</td>
              <td className="px-4 py-3"><GravedadBadge gravedad={inc.gravedad} /></td>
              <td className="px-4 py-3"><EstadoBadge estado={inc.estado} /></td>
              <td className="px-4 py-3 text-gray-600">
                {inc.reportadoPor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}