# Instrucciones de uso para posterior desarrollo / revisión

## Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) versión 18 o superior
- npm (viene incluido con Node.js)

Para verificar que los tienes instalados, ejecuta en la terminal:

```bash
node -v
npm -v
```

---

## Instalación

1. Clona el repositorio y entra a la carpeta del frontend:
```bash
git clone https://github.com/gllrmoliva/IDS2-proyecto-final.git
cd IDS2-proyecto-final/frontend
```

2. Instala las dependencias:
```bash
npm install
```

---

## Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre tu navegador en [http://localhost:5173](http://localhost:5173)

### Por si acaso
El servidor tiene hot reload, lo que significa que cualquier cambio que guardes en el código se refleja automáticamente en el navegador sin necesidad de reiniciar. Si aparece en blanco significa que hay algo que no está funcionando.

---

## Modo mock vs backend real

Por defecto el frontend puede funcionar con **datos mock** (sin necesidad de tener el backend corriendo). Para controlarlo, cada uno de los siguientes archivos tiene una variable `USE_MOCK` al inicio:

- `src/hooks/useIncidents.js`
- `src/hooks/useCases.js`
- `src/components/incidents/FormularioIncidente.jsx`
- `src/components/cases/FormularioCaso.jsx`

Para usar datos mock (ideal para desarrollo o correr tests):
```js
const USE_MOCK = true;
```

Para conectar al backend real:
```js
const USE_MOCK = false;
```

Los datos mock están definidos en `src/data/mockIncidents.js` y `src/data/mockCases.js`.

---

## Tests

Los tests están escritos con **Vitest** y **React Testing Library**, y cubren los criterios de aceptación de las tareas T1.2, T1.3, T8.1 y T12.2.

> **Importante:** los tests siempre corren con datos mock, independiente del valor de `USE_MOCK` en los hooks. No requieren que el backend esté corriendo.

### Instalar dependencias de test (solo la primera vez)

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Ejecutar los tests

Correr todos los tests una vez:
```bash
npm test
```

Modo watch (se re-ejecutan al guardar cambios):
```bash
npm run test:watch
```

### Archivos de test

Los tests se encuentran en `src/test/`:

| Archivo | Tarea | Tests |
|---|---|---|
| `FormularioIncidente.test.jsx` | T1.2 | 7 |
| `FormularioCaso.test.jsx` | T1.3 | 8 |
| `IncidentDetailModal.test.jsx` | T8.1 | 5 |
| `CaseMonitorView.test.jsx` | T12.2 | 5 |
| `IncidentBadges.test.jsx` | Badges | 3 |
| `CaseBadges.test.jsx` | Badges | 2 |


---

## Tecnologías utilizadas

- [React 19](https://react.dev/)
- [Vite 8](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router v7](https://reactrouter.com/)
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
