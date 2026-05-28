// Buscador de estudiantes con filtro por curso.
// Reutilizado en FormularioIncidente y FormularioCaso.
//
// Props:
//   placeholder  -> texto del input
//   onSeleccionar -> callback que recibe el estudiante seleccionado (o null al limpiar)
//   excluir       -> array de id_estudiante a excluir del listado
//   estudiantes   -> array de estudiantes (si no se pasa, usa MOCK)
 
import { useState, useMemo } from "react";
 
const MOCK_ESTUDIANTES = [
  { id_estudiante: '21.345.678-9', nombre: 'Valentina Rojas Soto',   nombre_curso: '3°A' },
  { id_estudiante: '21.456.789-0', nombre: 'Matías González Vera',   nombre_curso: '3°A' },
  { id_estudiante: '21.567.890-1', nombre: 'Isidora Campos Núñez',   nombre_curso: '3°A' },
  { id_estudiante: '21.678.901-2', nombre: 'Sebastián Muñoz Torres', nombre_curso: '2°B' },
  { id_estudiante: '21.789.012-3', nombre: 'Catalina Vega Morales',  nombre_curso: '2°B' },
  { id_estudiante: '21.890.123-4', nombre: 'Diego Herrera Lagos',    nombre_curso: '1°C' },
  { id_estudiante: '21.901.234-5', nombre: 'Javiera Soto Bravo',     nombre_curso: '4°D' },
];
 
export function BuscadorEstudiante({ placeholder, onSeleccionar, excluir = [], estudiantes }) {
  const lista = estudiantes ?? MOCK_ESTUDIANTES;
  const CURSOS = ['Todos', ...new Set(lista.map(e => e.nombre_curso))];
 
  const [query, setQuery]           = useState('');
  const [curso, setCurso]           = useState('Todos');
  const [abierto, setAbierto]       = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
 
  const resultados = useMemo(() => {
    const q = query.toLowerCase();
    return lista.filter(e => {
      if (excluir.includes(e.id_estudiante)) return false;
      if (curso !== 'Todos' && e.nombre_curso !== curso) return false;
      if (!q) return true;
      return e.nombre.toLowerCase().includes(q) || e.id_estudiante.includes(q);
    });
  }, [query, curso, excluir, lista]);
 
  const handleSeleccionar = (est) => {
    setSeleccionado(est);
    setQuery(est.nombre);
    setAbierto(false);
    onSeleccionar(est);
  };
 
  const handleLimpiar = () => {
    setSeleccionado(null);
    setQuery('');
    setCurso('Todos');
    onSeleccionar(null);
  };
 
  return (
    <div style={{ position: 'relative' }}>
      <div className="flex gap-2 items-center">
        <select value={curso} onChange={(e) => { setCurso(e.target.value); setAbierto(true); }}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700 text-sm"
          style={{ minWidth: '90px' }}>
          {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); setAbierto(true); if (seleccionado) { setSeleccionado(null); onSeleccionar(null); } }}
          onFocus={() => setAbierto(true)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
        />
        {seleccionado && (
          <button type="button" onClick={handleLimpiar} className="text-gray-400 hover:text-gray-600 text-lg px-1">✕</button>
        )}
      </div>
 
      {abierto && !seleccionado && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setAbierto(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
            background: 'white', border: '1px solid #d1d5db', borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxHeight: '180px', overflowY: 'auto',
          }}>
            {resultados.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No se encontraron estudiantes</div>
            ) : (
              resultados.map(est => (
                <div key={est.id_estudiante} onClick={() => handleSeleccionar(est)}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-800">{est.nombre}</span>
                  <span className="text-gray-400 ml-2">— {est.nombre_curso} · {est.id_estudiante}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
      {seleccionado && (
        <p className="text-xs text-gray-400 mt-1">{seleccionado.nombre_curso} · {seleccionado.id_estudiante}</p>
      )}
    </div>
  );
}
