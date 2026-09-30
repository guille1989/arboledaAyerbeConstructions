import { createBrowserRouter, redirect } from 'react-router'
import Landing from './pages/Landing'

export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  // El panel SHM (y recharts) se carga bajo demanda para aligerar la landing
  { path: '/shm', lazy: () => import('./pages/SHM').then((m) => ({ Component: m.default })) },
  // Rutas desconocidas vuelven al inicio en lugar de mostrar la pantalla de error de React Router
  { path: '*', loader: () => redirect('/') },
])
