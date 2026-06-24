// Traduce el cuerpo de error de FastAPI a un mensaje legible para el usuario.
// FastAPI devuelve `detail` como string o como un arreglo
// de objetos {loc, msg, type} en errores de validación 422.


const CAMPO_LEGIBLE = {
  desc: "Descripción",
  descripcion: "Descripción",
  fecha: "Fecha",
  fecha_inicio: "Fecha de inicio",
  fecha_cierre: "Fecha de cierre",
  gravedad: "Gravedad",
  categoria: "Categoría",
  estado: "Estado",
  estudiantes_json: "Estudiantes",
  estudiantes: "Estudiantes",
  nivel_medida: "Nivel de medida",
  tipo: "Tipo",
};

export function mensajeDeError(detail, status) {

  // Caso 0: errores de servidor 
  if (status >= 500) {
    return "Ocurrió un error interno en el servidor. Inténtalo nuevamente en unos momentos o avisa al equipo técnico.";
  }

  //Caso 1: detail es un string 
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  //Caso 2: detail es el arreglo de validación 422 de FastAPI
  if (Array.isArray(detail) && detail.length > 0) {
    const partes = detail.map((e) => {
      //loc suele ser ["body", "nombre_campo"]
      const campoRaw = Array.isArray(e.loc)
        ? e.loc.filter((x) => x !== "body").pop()
        : null;
      const campo = CAMPO_LEGIBLE[campoRaw] ?? campoRaw;
      const msg = e.msg ?? "valor inválido";
      return campo ? `${campo}: ${msg}` : msg;
    });
    return `Revisa los siguientes campos — ${partes.join("; ")}`;
  }

  // Caso 3: errores de permiso/sesión por código de estado.
  // Cubren los 403  cuando un rol entra a una sección o
  // ejecuta una acción que no le corresponde, y el 401 por sesión vencida.
  if (status === 403) {
    return "No tienes permiso para acceder a esta sección o realizar esta acción. Esta función está reservada para otro rol.";
  }
  if (status === 401) {
    return "Tu sesión expiró o no es válida. Vuelve a iniciar sesión para continuar.";
  }

  // Caso 4: nada útil, mensaje genérico con el código
  return status
    ? `Ocurrió un error al procesar la solicitud (código ${status}).`
    : "Ocurrió un error al procesar la solicitud.";
}