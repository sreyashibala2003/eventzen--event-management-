import { useAuth } from "../auth/AuthContext";
import AdminDashboardPage from "./AdminDashboardPage.jsx";
import UserDashboardPage from "./UserDashboardPage.jsx";

function DashboardPage() {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-lg">Loading...</div>;
  }

  if (isAdmin) {
    return <AdminDashboardPage />;
  }

  return <UserDashboardPage />;
}

export default DashboardPage;
