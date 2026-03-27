import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getToken, isTokenExpired } from "../auth/tokenStore";

function ProtectedRoute({ children, requiredRoles }) {
  const { isAuthenticated, loading, hasAnyRole } = useAuth();
  const location = useLocation();
  const token = getToken();
  const hasValidToken = Boolean(token) && !isTokenExpired(token);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-lg">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated && !hasValidToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (Array.isArray(requiredRoles) && requiredRoles.length > 0) {
    const allowed = typeof hasAnyRole === "function" && hasAnyRole(requiredRoles);
    if (!allowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
