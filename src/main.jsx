import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import PageWrapper from './components/layout/PageWrapper';
import ErrorPage from './routes/error';

import HomePage, { loader as homeLoader } from './routes/_index';
import SearchPage, { loader as searchLoader } from './routes/search';
import FoodPage, { loader as foodLoader, action as foodAction } from './routes/food.$id';
import ProfilePage, { loader as profileLoader, action as profileAction } from './routes/profile';
import AdminPage, { loader as adminLoader, action as adminAction } from './routes/admin';
import AuthCallbackPage from './routes/auth.callback';

const router = createBrowserRouter([
  {
    element: <PageWrapper />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <HomePage />,
        loader: homeLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: '/search',
        element: <SearchPage />,
        loader: searchLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: '/food/:id',
        element: <FoodPage />,
        loader: foodLoader,
        action: foodAction,
        errorElement: <ErrorPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
        loader: profileLoader,
        action: profileAction,
        errorElement: <ErrorPage />,
      },
      {
        path: '/admin',
        element: <AdminPage />,
        loader: adminLoader,
        action: adminAction,
        errorElement: <ErrorPage />,
      },
      {
        path: '/auth/callback',
        element: <AuthCallbackPage />,
        errorElement: <ErrorPage />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
