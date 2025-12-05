import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/login";
import Dashboard from "../pages/dashboard";
import WeatherHistory from "../pages/WeatherHistory";
import UsersPage from "../pages/Users";
import Explore from "../pages/Explore";
import { ProtectedRoute } from "../components/ProtectedRouter";


export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/weather",
    element: (
      <ProtectedRoute>
        <WeatherHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: "/users",
    element: (
      <ProtectedRoute>
        <UsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/explorar",
    element: (
      <ProtectedRoute>
        <Explore />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
]);
