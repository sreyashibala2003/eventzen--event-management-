import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import UserLayout from "../components/UserLayout";

function UserBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await bookingService.getMyBookings({ limit: 100 });
        setBookings(response?.data?.bookings || []);
      } catch (fetchError) {
        console.error("Unable to load user bookings", fetchError);
        setError("Unable to load your bookings right now.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <UserLayout title="My Bookings">
      <div className="min-h-screen bg-[var(--surface)] px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <section className="animate-rise rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
            <p className="mb-2 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
              Booking History
            </p>
            <h1 className="font-heading text-4xl leading-tight text-[var(--ink)] md:text-5xl">
              See every booking you&apos;ve made.
            </h1>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
              Track your event tickets, payment status, and download your ticket
              PDFs from one place.
            </p>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--line)] bg-gradient-to-br from-sky-50 to-cyan-100 p-6 md:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-3xl text-sky-950">
                  My Bookings
                </h2>
                <p className="mt-1 text-sm text-sky-800">
                  Tickets booked using your current account.
                </p>
              </div>
              <div className="rounded-full bg-sky-500 p-3 text-white">
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

            {isLoading ? (
              <div className="rounded-2xl border border-sky-200 bg-white/80 p-5 text-sm text-sky-900">
                Loading your bookings...
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
                    className="rounded-2xl border border-sky-200 bg-white/90 p-5 backdrop-blur-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                          {booking.bookingReference || "Booking Reference"}
                        </p>
                        <h3 className="font-heading text-2xl text-[var(--ink)]">
                          {booking.event?.eventName || "Unnamed Event"}
                        </h3>
                        <p className="text-sm text-[var(--muted)]">
                          Venue:{" "}
                          {booking.event?.venueName || "Venue unavailable"}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          Ticket code: {booking.ticket?.ticketCode || "Pending"}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          Booking status: {booking.bookingStatus || "Pending"}
                        </p>
                      </div>

                      <div className="flex min-w-[220px] flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                        <p className="text-sm font-medium text-sky-900">
                          Payment: {booking.payment?.status || "Pending"}
                        </p>
                        <p className="text-sm text-sky-800">
                          Method: {booking.payment?.method || "Unavailable"}
                        </p>
                        <p className="text-sm text-sky-800">
                          Paid at:{" "}
                          {booking.payment?.paidAtUtc
                            ? new Date(
                                booking.payment.paidAtUtc,
                              ).toLocaleString("en-IN")
                            : "Pending"}
                        </p>
                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              bookingService.downloadTicket(
                                booking.bookingId,
                                `ticket-${booking.bookingReference || booking.bookingId}.pdf`,
                              )
                            }
                            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                          >
                            Download Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-sky-200 bg-white/80 p-6 text-sm text-sky-900">
                <p>You haven&apos;t made any bookings yet.</p>
                <button
                  type="button"
                  onClick={() => navigate("/events/discover")}
                  className="mt-4 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                >
                  Discover Events
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </UserLayout>
  );
}

export default UserBookingsPage;
