import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { MantineProvider } from '@mantine/core'
import { RootLayout } from './routes/__root'
import { HomePage } from './routes/index'
import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'

const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute]) })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>
)
