import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const mod = await import('@/pages/Login')
      return { Component: mod.default }
    },
  },
  {
    path: '/dashboard',
    lazy: async () => {
      const mod = await import('@/pages/Dashboard')
      return { Component: mod.default }
    },
  },
  {
    path: '/pmd',
    lazy: async () => {
      const mod = await import('@/pages/PmdOrders')
      return { Component: mod.default }
    },
  },
  {
    path: '/conference',
    lazy: async () => {
      const mod = await import('@/pages/Conference')
      return { Component: mod.default }
    },
  },
])

export default router
