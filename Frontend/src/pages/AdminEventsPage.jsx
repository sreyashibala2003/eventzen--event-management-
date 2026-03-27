import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { eventService } from "../api/eventService";

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

const formatTime = (timeValue) => {
  const [hours, minutes] = String(timeValue || "00:00").split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatStatus = (status) =>
  String(status || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getStatusBadgeClass = (status) => {
  if (status === "confirmed") return "badge-success";
  if (status === "cancelled") return "badge-error";
  return "badge-warning";
};

function AdminEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await eventService.getEvents({
        limit: 100,
        sort: "-event_date",
      });
      setEvents(response?.data?.events || []);
    } catch (err) {
      setError("Failed to load events.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (eventItem) => {
    if (!window.confirm(`Are you sure you want to delete "${eventItem.event_name}"?`)) {
      return;
    }

    try {
      setDeleteLoading(eventItem.event_id);
      await eventService.deleteEvent(eventItem.event_id);
      setEvents((currentEvents) =>
        currentEvents.filter((item) => item.event_id !== eventItem.event_id),
      );
      window.alert("Event deleted successfully");
    } catch (err) {
      window.alert(
        `Failed to delete event: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const confirmedEvents = events.filter((event) => event.status === "confirmed");
  const upcomingEvents = events.filter(
    (event) => new Date(event.event_date) >= new Date(new Date().setHours(0, 0, 0, 0)),
  );

  return (
    <AdminLayout>
      <div className="relative container mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.26),_transparent_65%)]" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
        </div>

        <section className="animate-rise mb-7 rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Event Operations
              </p>
              <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                Manage Events
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Review live event listings, edit planning details, and remove
                events that should no longer appear on discovery.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchEvents}
                className="admin-btn admin-btn-secondary"
              >
                Refresh
              </button>
              <button
                onClick={() => navigate("/admin/events/new")}
                className="admin-btn admin-btn-primary"
              >
                <svg
                  className="mr-2 h-5 w-5"
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
                Add New Event
              </button>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Total Events
            </p>
            <p className="mt-3 font-heading text-4xl">{events.length}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              In the discover catalog
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Confirmed Events
            </p>
            <p className="mt-3 font-heading text-4xl text-emerald-700">
              {confirmedEvents.length}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ready for execution
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Upcoming Events
            </p>
            <p className="mt-3 font-heading text-4xl text-sky-700">
              {upcomingEvents.length}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Scheduled from today onwards
            </p>
          </article>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        <section className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_18px_55px_rgba(5,22,28,0.08)] md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-2xl">Event Directory</h2>
            <p className="text-sm text-[var(--muted)]">
              Showing {events.length} results
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white/70">
            <table className="table table-zebra text-sm [&_th]:px-6 [&_th]:py-4 [&_th]:font-semibold [&_td]:px-6 [&_td]:py-5 [&_td]:align-middle">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--paper)]/80 text-[0.72rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="min-w-[17rem]">Event Name</th>
                  <th className="min-w-[11rem]">Date & Time</th>
                  <th className="min-w-[11rem]">Venue</th>
                  <th className="min-w-[10rem]">Vendor</th>
                  <th className="min-w-[9rem]">Guests</th>
                  <th className="min-w-[9rem]">Status</th>
                  <th className="min-w-[10rem] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-[var(--muted)]">
                      No events found. Add your first event!
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.event_id} className="hover">
                      <td className="font-medium text-[var(--ink)]">
                        <div className="font-semibold">{event.event_name}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {event.event_type}
                        </div>
                      </td>
                      <td className="text-[var(--muted)]">
                        {formatDate(event.event_date)}
                        <br />
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </td>
                      <td className="text-[var(--muted)]">
                        {event.venue_snapshot?.venue_name}
                        <br />
                        {event.venue_snapshot?.city}
                      </td>
                      <td className="text-[var(--muted)]">
                        {event.vendor_snapshot?.vendor_name}
                        <br />
                        {event.vendor_snapshot?.service_type
                          ?.split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </td>
                      <td className="text-[var(--muted)]">
                        {event.guest_count?.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                          {formatStatus(event.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/events/${event.event_id}`, {
                                state: {
                                  backTo: "/admin/events",
                                },
                              })
                            }
                            className="admin-btn admin-btn-soft admin-btn-sm admin-btn-icon"
                            title="View"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/admin/events/edit/${event.event_id}`)
                            }
                            className="admin-btn admin-btn-primary admin-btn-sm admin-btn-icon"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(event)}
                            className="admin-btn admin-btn-danger admin-btn-sm admin-btn-icon"
                            disabled={deleteLoading === event.event_id}
                            title="Delete"
                          >
                            {deleteLoading === event.event_id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminEventsPage;
