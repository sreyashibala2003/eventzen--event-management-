import { Navigate, Route, Routes } from "react-router-dom";
import LandingRoute from "./components/LandingRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import VenueList from "./components/VenueList.jsx";
import VendorList from "./components/VendorList.jsx";
import VenueDetailPage from "./pages/VenueDetailPage.jsx";
import VendorDetailPage from "./pages/VendorDetailPage.jsx";
import AdminVenuesPage from "./pages/AdminVenuesPage.jsx";
import AdminVendorsPage from "./pages/AdminVendorsPage.jsx";
import AdminEventsPage from "./pages/AdminEventsPage.jsx";
import AdminBookingsPage from "./pages/AdminBookingsPage.jsx";
import AdminBudgetManagementPage from "./pages/AdminBudgetManagementPage.jsx";
import VenueFormPage from "./pages/VenueFormPage.jsx";
import VendorFormPage from "./pages/VendorFormPage.jsx";
import CreateEventPage from "./pages/CreateEventPage.jsx";
import DiscoverEventsPage from "./pages/DiscoverEventsPage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import PaymentWindowPage from "./pages/PaymentWindowPage.jsx";
import UserEventsPage from "./pages/UserEventsPage.jsx";
import UserBookingsPage from "./pages/UserBookingsPage.jsx";
import UserVenuesPage from "./pages/UserVenuesPage.jsx";
import UserVendorsPage from "./pages/UserVendorsPage.jsx";
import MyProfilePage from "./pages/MyProfilePage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Venue Routes */}
      <Route path="/venues" element={<VenueList />} />
      <Route path="/venues/:id" element={<VenueDetailPage />} />

      {/* Vendor Routes (Protected) */}
      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <VendorList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendors/:id"
        element={
          <ProtectedRoute>
            <VendorDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/create"
        element={
          <ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/discover"
        element={
          <ProtectedRoute>
            <DiscoverEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/my"
        element={
          <ProtectedRoute>
            <UserEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/my"
        element={
          <ProtectedRoute>
            <UserBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MyProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/venues"
        element={
          <ProtectedRoute>
            <UserVenuesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/vendors"
        element={
          <ProtectedRoute>
            <UserVendorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/edit/:id"
        element={
          <ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <ProtectedRoute>
            <EventDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/payment"
        element={
          <ProtectedRoute>
            <PaymentWindowPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes (Protected) */}
      <Route
        path="/admin/venues"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminVenuesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/venues/new"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <VenueFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/venues/edit/:id"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <VenueFormPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/vendors"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminVendorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vendors/new"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <VendorFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vendors/edit/:id"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <VendorFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/new"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/edit/:id"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/:id"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <EventDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/budgets"
        element={
          <ProtectedRoute requiredRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminBudgetManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
