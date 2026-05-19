// layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";

export function MainLayout() {
  return <Outlet />;  // por ahora vacío, después aquí va sidebar y topbar
}