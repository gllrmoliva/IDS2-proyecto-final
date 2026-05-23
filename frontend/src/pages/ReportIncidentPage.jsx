import FormularioIncidente from "../components/incidents/FormularioIncidente";
import { Link } from "react-router-dom";

export function ReportIncidentPage() {
  return (
    <div>
      <div className="p-4">
        <Link to="/incidents" className="text-sm text-blue-700 font-bold hover:underline">
          ← Volver al monitor
        </Link>
      </div>
      <FormularioIncidente />
    </div>
  );
}