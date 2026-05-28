// Loading And Error
// Estados de carga y error reutilizables en todas las vistas.
// Props LoadingState: mensaje
// Props ErrorState:   message, onRetry
 
export function LoadingState({ mensaje = "Cargando…" }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <svg className="mx-auto mb-4 w-12 h-12 animate-spin text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="font-semibold">{mensaje}</p>
      </div>
    </div>
  );
}
 
export function ErrorState({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center bg-white rounded-2xl p-8 shadow border border-red-100 max-w-sm">
        <svg className="mx-auto mb-4 w-14 h-14 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="font-semibold text-red-700 mb-4">{message}</p>
        <button onClick={onRetry} className="px-6 py-2.5 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-colors">
          Reintentar
        </button>
      </div>
    </div>
  );
}
