import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import PageLoading from "./PageLoading";


type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoading />;
  
  if (!user) {
    // Preserve full intended destination (pathname + search + hash)
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash || ""}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
}
