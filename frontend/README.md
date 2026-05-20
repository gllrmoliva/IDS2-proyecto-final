# Instrucciones de "uso" para posterior desarrollo / revisión
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

### Por si acaso:  
El servidor tiene hot reload, lo que significa cualquier cambio que guardes en el código se refleja automáticamente en el navegador sin necesidad de reiniciar, en casos puede demorarse pero suele retornar mensaje de warning indicando lo sucedido, si aparece en blanco significa que hay algo que no esta funcionando.

---
## Aviso útil
Por ahora el frontend usa datos mock definidos en `src/data/mockIncidents.js`.

## Tecnologías utilizadas
 
- [React 19](https://react.dev/)
- [Vite 8](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router v7](https://reactrouter.com/)


