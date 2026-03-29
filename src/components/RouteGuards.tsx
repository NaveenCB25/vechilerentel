import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export function RequireUser() {
  const { isLoading, isUserAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  if (!isUserAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <Outlet />;
}

export function RequireAdmin() {
  const { isLoading, isAdminAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?mode=admin&redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <Outlet />;
}
