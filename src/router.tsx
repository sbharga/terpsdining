import { createBrowserRouter, ScrollRestoration } from 'react-router'
import Layout from './components/Layout'
import { NotFound } from './components/UI'
import Home from './pages/Home'
import Hall from './pages/Hall'
import Item from './pages/Item'
import Search from './pages/Search'
import Hours from './pages/Hours'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Account from './pages/Account'
export const router = createBrowserRouter([{ element: <><ScrollRestoration /><Layout /></>, children: [
  { path: '/', element: <Home /> },
  { path: '/halls/:slug', element: <Hall /> },
  { path: '/items/:id', element: <Item /> },
  { path: '/search', element: <Search /> },
  { path: '/hours', element: <Hours /> },
  { path: '/privacy', element: <Privacy /> },
  { path: '/terms', element: <Terms /> },
  { path: '/account', element: <Account /> },
  { path: '*', element: <NotFound /> },
] }])
