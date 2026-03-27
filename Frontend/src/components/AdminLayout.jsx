import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AdminSidebar from "./AdminSidebar";
import Footer from "./Footer";

function AdminLayout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  // If not admin, just render children without sidebar
  if (!isAdmin) {
    return children;
  }

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-[var(--paper)] border-b border-[var(--line)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--ink)]">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm shadow-[0_10px_24px_rgba(17,50,61,0.06)] md:block">
                {user?.firstName} {user?.lastName}
                <span className="admin-badge ml-2 align-middle">
                  ADMIN
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="admin-btn admin-btn-primary"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
        <Footer className="shrink-0" />
      </div>
    </div>
  );
}

export default AdminLayout;
