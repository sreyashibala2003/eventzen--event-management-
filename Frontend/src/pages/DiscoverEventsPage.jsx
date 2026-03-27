import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { eventService } from "../api/eventService";
import { venueService } from "../api/venueVendorService";
import { isBookableEventType } from "../utils/bookableEventTypes";

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

const formatCurrency = (amount) => {
  if (typeof amount !== "number") return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const truncateText = (value, maxLength) => {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
};

const formatLabel = (value) =>
  String(value || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function DiscoverEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [venueImages, setVenueImages] = useState({});
  const [venueDetails, setVenueDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await eventService.getEvents({
          upcoming_only: true,
          limit: 24,
          sort: "event_date",
        });
        const eventItems = response?.data?.events || [];
        setEvents(eventItems);

        const uniqueVenueIds = [
          ...new Set(
            eventItems
              .map(
                (event) =>
                  event.assignments?.venue_id || event.venue_snapshot?.venue_id,
              )
              .filter(Boolean),
          ),
        ];

        const venueEntries = await Promise.all(
          uniqueVenueIds.map(async (venueId) => {
            try {
              const venueResponse = await venueService.getVenueById(venueId);
              const venue = venueResponse?.data?.venue;
              const primaryImage =
                venue?.images?.find((image) => image.is_primary)?.url ||
                venue?.images?.[0]?.url ||
                "";

              return [venueId, { image: primaryImage, venue }];
            } catch (venueError) {
              console.error("Unable to load venue image", venueError);
              return [venueId, { image: "", venue: null }];
            }
          }),
        );

        const mappedEntries = Object.fromEntries(venueEntries);
        setVenueImages(
          Object.fromEntries(
            Object.entries(mappedEntries).map(([venueId, value]) => [
              venueId,
              value.image,
            ]),
          ),
        );
        setVenueDetails(
          Object.fromEntries(
            Object.entries(mappedEntries).map(([venueId, value]) => [
              venueId,
              value.venue,
            ]),
          ),
        );
      } catch (err) {
        setError("Unable to load events right now.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <UserLayout title="Discover Events">
      <div className="relative min-h-full overflow-hidden bg-[var(--surface)] text-[var(--ink)]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.28),_transparent_65%)]" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
          <section className="animate-rise rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_24px_60px_rgba(5,22,28,0.08)] md:p-12">
            <p className="mb-3 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">
              Event Discovery
            </p>
            <h1 className="max-w-3xl font-heading text-4xl leading-tight md:text-6xl">
              Find events worth showing up for.
            </h1>
            <p className="mt-5 max-w-2xl text-[var(--muted)] md:text-lg">
              Browse live event cards created from the planning workflow, with
              assigned venues and vendors already attached.
            </p>
          </section>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <section className="mt-8 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-60 animate-pulse rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)]"
                />
              ))}
            </section>
          ) : events.length === 0 ? (
            <section className="mt-8 rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-10 text-center shadow-[0_18px_55px_rgba(5,22,28,0.08)]">
              <h2 className="font-heading text-3xl">No events yet</h2>
              <p className="mt-3 text-[var(--muted)]">
                Create the first event and it will appear here in the listing.
              </p>
            </section>
          ) : (
            <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => {
                const showTicketPrice = isBookableEventType(event.event_type);
                const budgetLabel =
                  event.budget?.label ||
                  [
                    formatCurrency(event.budget?.min_amount),
                    formatCurrency(event.budget?.max_amount),
                  ]
                    .filter(Boolean)
                    .join(" - ");
                const venueId =
                  event.assignments?.venue_id || event.venue_snapshot?.venue_id;
                const venueImage = venueImages[venueId];

                return (
                  <article
                    key={event.event_id}
                    className="animate-rise-delayed overflow-hidden rounded-[1.55rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_18px_42px_rgba(8,28,36,0.11)]"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {venueImage ? (
                        <img
                          src={venueImage}
                          alt={
                            event.venue_snapshot?.venue_name || event.event_name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-[linear-gradient(135deg,#163744_0%,#1f5669_48%,#f0bf88_100%)]" />
                      )}
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,22,28,0.08)_0%,rgba(8,22,28,0.72)_100%)]" />
                      <div className="absolute right-4 top-4">
                        <span className="rounded-full bg-white/95 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--brand-deep)] shadow-[0_10px_24px_rgba(5,22,28,0.18)]">
                          {event.event_type}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-white/78">
                          {formatDate(event.event_date)} ·{" "}
                          {formatTime(event.start_time)} to{" "}
                          {formatTime(event.end_time)}
                        </p>
                        <h2 className="mt-1.5 font-heading text-[1.7rem] leading-tight">
                          {event.event_name}
                        </h2>
                        <p className="mt-1 text-[0.82rem] text-white/80">
                          {event.venue_snapshot?.venue_name},{" "}
                          {event.venue_snapshot?.city}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 p-3">
                      <p className="text-[0.86rem] leading-5 text-[var(--muted)]">
                        {truncateText(event.description, 52)}
                      </p>

                      <div
                        className={`grid grid-cols-2 gap-1.5 text-sm text-[var(--ink)] ${
                          showTicketPrice ? "md:grid-cols-4" : "md:grid-cols-3"
                        }`}
                      >
                        <div className="rounded-[0.9rem] border border-[var(--line)] bg-[var(--soft)]/32 px-2.5 py-2">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                            Time
                          </p>
                          <p className="mt-0.5 text-[0.8rem] font-semibold">
                            {formatTime(event.start_time)}
                          </p>
                        </div>
                        <div className="rounded-[0.9rem] border border-[var(--line)] bg-[var(--soft)]/32 px-2.5 py-2">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                            Guests
                          </p>
                          <p className="mt-0.5 text-[0.8rem] font-semibold">
                            {event.guest_count?.toLocaleString("en-IN")}
                          </p>
                        </div>
                        {showTicketPrice ? (
                          <div className="rounded-[0.9rem] border border-[var(--line)] bg-[var(--soft)]/32 px-2.5 py-2">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                              Ticket
                            </p>
                            <p className="mt-0.5 text-[0.8rem] font-semibold">
                              {formatCurrency(event.ticket_price) || "Free"}
                            </p>
                          </div>
                        ) : null}
                        <div className="rounded-[0.9rem] border border-[var(--line)] bg-[var(--soft)]/32 px-2.5 py-2">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                            Budget
                          </p>
                          <p className="mt-0.5 text-[0.8rem] font-semibold">
                            {truncateText(budgetLabel, 10)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[0.95rem] border border-[var(--line)] bg-white/82 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                              Organizer
                            </p>
                            <p className="mt-0.5 text-[0.86rem] font-semibold text-[var(--ink)]">
                              {truncateText(event.organizer?.name, 16)}
                            </p>
                          </div>
                          <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[0.68rem] font-medium text-[var(--muted)]">
                            {formatLabel(event.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-[0.76rem] text-[var(--muted)]">
                          {truncateText(
                            event.organizer?.organization ||
                              event.organizer?.email,
                            24,
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/events/${event.event_id}`, {
                            state: {
                              backTo: "/events/discover",
                              event,
                              venue: venueDetails[venueId] || null,
                            },
                          })
                        }
                        className="w-full rounded-[1rem] bg-[var(--brand-deep)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

export default DiscoverEventsPage;
