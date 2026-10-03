import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout'
import { NotFound } from './components/UI'
import Home from './pages/Home'
import Hall from './pages/Hall'
import Item from './pages/Item'
import Search from './pages/Search'
import Hours from './pages/Hours'
export const router = createBrowserRouter([{ element: <Layout />, children: [
  { path: '/', element: <Home /> },
  { path: '/halls/:slug', element: <Hall /> },
  { path: '/items/:id', element: <Item /> },
  { path: '/search', element: <Search /> },
  { path: '/hours', element: <Hours /> },
  { path: '*', element: <NotFound /> },
] }])
