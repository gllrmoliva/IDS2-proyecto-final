import { useState, useMemo, useEffect } from "react";

export function BuscadorEstudiante({ placeholder, onSeleccionar, excluir = [], estudiantes }) {
  // Inicializamos la lista con las props si existen, de lo contrario un array vacío
  const [lista, setLista] = useState(estudiantes || []);
  const [cargando, setCargando] = useState(!estudiantes);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [curso, setCurso] = useState('Todos');
  const [abierto, setAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    // Si los estudiantes se inyectan directamente como prop, omitimos el fetch
    if (estudiantes) {
      setLista(estudiantes);
      setCargando(false);
      return;
    }

    const fetchEstudiantes = async () => {
      try {
        // TODO: Ajusta la obtención del token según cómo se maneje la sesión en Panoptes
        const token = localStorage.getItem("token"); 

        // El prefijo asume una estructura estándar; ajústalo si FastAPI se levanta en un host distinto
        const response = await fetch("/api/students/get_all", {
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar los estudiantes");
        }

        const data = await response.json();
        setLista(data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar datos del backend.");
      } finally {
        setCargando(false);
      }
    };

    fetchEstudiantes();
  }, [estudiantes]);

  const CURSOS = ['Todos', ...new Set(lista.map(e => e.nombre_curso))];

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
      
      {/* Indicadores de estado de red */}
      {cargando && <p className="text-xs text-gray-500 mb-1">Cargando estudiantes...</p>}
      {error && <p className="text-xs text-red-500 mb-1">{error}</p>}

      <div className="flex gap-2 items-center">
        <select 
          value={curso} 
          onChange={(e) => { setCurso(e.target.value); setAbierto(true); }}
          disabled={cargando || error}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700 text-sm disabled:bg-gray-100"
          style={{ minWidth: '90px' }}
        >
          {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input 
          type="text" 
          value={query}
          disabled={cargando || error}
          onChange={(e) => { 
            setQuery(e.target.value); 
            setAbierto(true); 
            if (seleccionado) { 
              setSeleccionado(null); 
              onSeleccionar(null); 
            } 
          }}
          onFocus={() => setAbierto(true)}
          placeholder={cargando ? "Cargando..." : placeholder}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700 disabled:bg-gray-100"
        />
        {seleccionado && (
          <button type="button" onClick={handleLimpiar} className="text-gray-400 hover:text-gray-600 text-lg px-1">✕</button>
        )}
      </div>
 
      {abierto && !seleccionado && !cargando && !error && (
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