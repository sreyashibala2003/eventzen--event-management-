import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import { useAuth } from "../auth/AuthContext";
import AdminLayout from "../components/AdminLayout";

function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const displayName =
    user?.firstName || user?.name || user?.email?.split("@")?.[0] || "there";

  useEffect(() => {
    const fetchAdminBookings = async () => {
      try {
        const response = await bookingService.getAdminBookings({ limit: 5 });
        setBookings(response?.data?.bookings || []);
      } catch (error) {
        console.error("Unable to load admin bookings", error);
      }
    };

    fetchAdminBookings();
  }, []);

  const latestBooking = bookings[0];

  return (
    <AdminLayout>
      <div className="relative min-h-screen overflow-hidden bg-[var(--surface)] text-[var(--ink)]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-36 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,123,67,0.24),_transparent_65%)]" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.2),_transparent_70%)]" />
        </div>

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-14 pt-8 md:px-10">
          <section className="animate-rise rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_24px_60px_rgba(5,22,28,0.08)] md:p-12">
            <p className="mb-3 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">
              Admin Dashboard
            </p>
            <h1 className="max-w-3xl font-heading text-4xl leading-tight md:text-6xl">
              Hello, {displayName}. Your control center is ready.
            </h1>
            <p className="mt-5 max-w-2xl text-[var(--muted)] md:text-lg">
              Plan events, manage vendors, manage venues, track guests, and
              execute seamlessly all in one place.
            </p>
          </section>

          <section className="animate-rise-delayed">
            <h2 className="mb-4 font-heading text-2xl">Admin Management</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-br from-blue-50 to-blue-100 p-6 md:p-8">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-2xl text-blue-900">
                      Venue Management
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Manage all venues and halls
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-500 p-3 text-white">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button
                    onClick={() => navigate("/admin/venues")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    Manage Venues
                  </button>
                  <button
                    onClick={() => navigate("/admin/venues/new")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-3 font-medium text-blue-700 transition-colors hover:bg-blue-50"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add New Venue
                  </button>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-br from-purple-50 to-purple-100 p-6 md:p-8">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-2xl text-purple-900">
                      Vendor Management
                    </h3>
                    <p className="mt-1 text-sm text-purple-700">
                      Manage all service vendors
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-500 p-3 text-white">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button
                    onClick={() => navigate("/admin/vendors")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    Manage Vendors
                  </button>
                  <button
                    onClick={() => navigate("/admin/vendors/new")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-300 bg-white px-4 py-3 font-medium text-purple-700 transition-colors hover:bg-purple-50"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add New Vendor
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="animate-rise-delayed">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-br from-amber-50 to-orange-100 p-6 md:p-8">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-2xl text-amber-950">
                      Event Management
                    </h3>
                    <p className="mt-1 text-sm text-amber-800">
                      Create, organize, and manage all events effortlessly
                    </p>
                  </div>
                  <div className="rounded-full bg-amber-500 p-3 text-white">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button
                    onClick={() => navigate("/admin/events")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-medium text-white transition-colors hover:bg-amber-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    Manage Events
                  </button>
                  <button
                    onClick={() => navigate("/admin/events/new")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-3 font-medium text-amber-700 transition-colors hover:bg-amber-50"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Event
                  </button>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-br from-emerald-50 to-teal-100 p-6 md:p-8">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-2xl text-teal-950">
                      Booking Management
                    </h3>
                    <p className="mt-1 text-sm text-teal-800">
                      View all booked tickets and payment updates
                    </p>
                  </div>
                  <div className="rounded-full bg-teal-500 p-3 text-white">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 14l2 2 4-4m5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button
                    onClick={() => navigate("/admin/bookings")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    View Bookings
                  </button>
                  <div className="rounded-xl border border-teal-300 bg-white px-4 py-3 text-sm text-teal-900">
                    <span className="font-semibold">Recent bookings:</span>{" "}
                    {bookings.length}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboardPage;
