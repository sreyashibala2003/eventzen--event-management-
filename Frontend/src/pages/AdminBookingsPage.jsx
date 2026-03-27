import { useEffect, useState } from "react";
import { bookingService } from "../api/bookingService";
import AdminLayout from "../components/AdminLayout";

function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await bookingService.getAdminBookings({ limit: 100 });
        setBookings(response?.data?.bookings || []);
      } catch (fetchError) {
        console.error("Unable to load admin bookings", fetchError);
        setError("Unable to load bookings right now.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[var(--surface)] px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_24px_60px_rgba(5,22,28,0.08)] md:p-10">
            <p className="mb-3 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">
              Booking Overview
            </p>
            <h1 className="font-heading text-4xl leading-tight text-[var(--ink)] md:text-5xl">
              View all booked tickets.
            </h1>
            <p className="mt-4 max-w-3xl text-[var(--muted)] md:text-lg">
              Review every booking, payment status, ticket code, and download
              tickets directly from one place.
            </p>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--line)] bg-gradient-to-br from-emerald-50 to-teal-100 p-6 md:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-3xl text-teal-950">
                  All Bookings
                </h2>
                <p className="mt-1 text-sm text-teal-800">
                  Complete list of tickets booked across events.
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

            {isLoading ? (
              <div className="rounded-2xl border border-teal-200 bg-white/80 p-5 text-sm text-teal-900">
                Loading bookings...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            ) : bookings.length ? (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <article
                    key={booking.bookingId}
                    className="rounded-2xl border border-teal-200 bg-white/90 p-5 backdrop-blur-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                          {booking.bookingReference}
                        </p>
                        <h3 className="font-heading text-2xl text-[var(--ink)]">
                          {booking.event?.eventName || "Unnamed Event"}
                        </h3>
                        <p className="text-sm text-[var(--muted)]">
                          Booked by {booking.user?.name || "Unknown User"}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          Venue: {booking.event?.venueName || "Venue unavailable"}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          Ticket code: {booking.ticket?.ticketCode || "Pending"}
                        </p>
                      </div>

                      <div className="flex min-w-[220px] flex-col gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                        <p className="text-sm font-medium text-teal-900">
                          Payment: {booking.payment?.status || "Pending"}
                        </p>
                        <p className="text-sm text-teal-800">
                          Method: {booking.payment?.method || "Unavailable"}
                        </p>
                        <p className="text-sm text-teal-800">
                          Paid at:{" "}
                          {booking.payment?.paidAtUtc
                            ? new Date(
                                booking.payment.paidAtUtc,
                              ).toLocaleString("en-IN")
                            : "Pending"}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            bookingService.downloadTicket(
                              booking.bookingId,
                              `ticket-${booking.bookingReference}.pdf`,
                            )
                          }
                          className="mt-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                        >
                          Download Ticket
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-teal-200 bg-white/80 p-5 text-sm text-teal-900">
                No bookings found yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminBookingsPage;
