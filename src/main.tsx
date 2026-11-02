import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { hydrate, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { queryClient } from './api/queries'
import { router } from './router'

const state = document.getElementById('query-state')?.textContent
if (state) hydrate(queryClient, JSON.parse(state))

const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>
  </StrictMode>
)
const container = document.getElementById('root')!
if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)
