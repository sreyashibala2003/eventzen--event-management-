import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getToken, isTokenExpired } from "../auth/tokenStore";
import HomePage from "../pages/HomePage";

function LandingRoute() {
  const { isAuthenticated, loading } = useAuth();
  const token = getToken();
  const hasValidToken = Boolean(token) && !isTokenExpired(token);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-lg">
        Loading...
      </div>
    );
  }

  if (isAuthenticated || hasValidToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <HomePage />;
}

export default LandingRoute;
