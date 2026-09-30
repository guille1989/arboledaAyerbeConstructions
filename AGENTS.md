# Arboleda Averbe Construcciones — sitio web

React 19 + Vite 8 + Tailwind CSS v4 + React Router 8, exportado desde Figma Make y desplegado en Vercel.

## Estructura

- `src/pages/Landing.tsx` — landing (`/`), secciones con anclas `#servicios`, `#metodologia`, `#entregables`, `#solicitud`
- `src/pages/SHM.tsx` — panel demo de monitoreo estructural (`/shm`), usa `recharts`; se carga bajo demanda
- `src/routes.ts` — rutas; cualquier ruta desconocida redirige a `/`
- `src/index.css` — import de Tailwind, fuentes (Google Fonts) y tokens de color en `@theme`
- `src/imports/index.html` — HTML original de referencia del diseño (no forma parte del build)
- `vercel.json` — rewrite SPA a `/index.html` para que `/shm` funcione al recargar

## Comandos (pnpm)

- `pnpm install`
- `pnpm dev` — servidor de desarrollo
- `pnpm build` — build de producción en `dist/`
- `pnpm preview` — sirve `dist/` localmente
- `pnpm typecheck`
