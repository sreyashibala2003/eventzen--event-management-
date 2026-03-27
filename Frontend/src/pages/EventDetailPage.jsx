import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import UserLayout from "../components/UserLayout";
import { eventService } from "../api/eventService";
import { bookingService } from "../api/bookingService";
import { venueService } from "../api/venueVendorService";
import { useAuth } from "../auth/AuthContext";
import { isBookableEventType } from "../utils/bookableEventTypes";

const formatDate = (dateValue) => {
  if (!dateValue) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
};

const formatTime = (timeValue) => {
  if (!timeValue) return "-";

  const [hours, minutes] = String(timeValue || "00:00").split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatLabel = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const pickFirstValue = (...values) =>
  values.find((value) => String(value || "").trim()) || "-";

const getEventHero = (eventItem, venue) =>
  venue?.images?.find((image) => image.is_primary)?.url ||
  venue?.images?.[0]?.url ||
  eventItem?.venue_snapshot?.image_url ||
  "";

function DetailItem({ label, value, breakWords = false }) {
  return (
    <div>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </div>
      <div
        className={`mt-2 text-base text-[var(--ink)] ${breakWords ? "break-all" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function EventDetailPage() {
  const { isAdmin } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [eventItem, setEventItem] = useState(location.state?.event || null);
  const [venue, setVenue] = useState(location.state?.venue || null);
  const [loading, setLoading] = useState(!location.state?.event);
  const [error, setError] = useState("");
  const [bookingNotice, setBookingNotice] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const panelClass =
    "rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_18px_55px_rgba(5,22,28,0.08)] md:p-6";
  const Layout = isAdmin ? AdminLayout : UserLayout;
  const defaultBackTo = isAdmin ? "/admin/events" : "/events/discover";
  const backTo = location.state?.backTo || defaultBackTo;
  const isBookableEvent = isBookableEventType(eventItem?.event_type);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const eventResponse = await eventService.getEventById(id);
        const eventData = eventResponse?.data?.event;

        if (!eventData) {
          throw new Error("Event details were not returned by the server");
        }

        setEventItem(eventData);

        const venueId =
          eventData.assignments?.venue_id || eventData.venue_snapshot?.venue_id;

        if (!venueId) {
          setVenue(null);
          return;
        }

        try {
          const venueResponse = await venueService.getVenueById(venueId);
          setVenue(venueResponse?.data?.venue || null);
        } catch (venueError) {
          console.error("Unable to load venue details for event", venueError);
          setVenue(null);
        }
      } catch (err) {
        setError("Failed to load event details. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if (isAdmin || !eventItem?.event_id) {
      setConfirmedBooking(null);
      return;
    }

    let cancelled = false;

    const fetchConfirmedBooking = async () => {
      try {
        const response = await bookingService.getMyBookings({ limit: 50 });
        const bookings = Array.isArray(response?.data?.bookings)
          ? response.data.bookings
          : [];

        const matched = bookings.find((booking) => {
          const bookingEventId =
            booking?.event?.eventId ||
            booking?.event?.event_id ||
            booking?.eventId;
          const bookingStatus = String(
            booking?.bookingStatus || "",
          ).toUpperCase();
          const paymentStatus = String(
            booking?.payment?.status || "",
          ).toUpperCase();

          return (
            bookingEventId === eventItem.event_id &&
            bookingStatus === "CONFIRMED" &&
            paymentStatus === "PAID"
          );
        });

        if (!cancelled) {
          setConfirmedBooking(matched || null);
        }
      } catch (bookingError) {
        console.error(
          "Unable to load user bookings for event detail",
          bookingError,
        );
      }
    };

    fetchConfirmedBooking();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, eventItem?.event_id]);

  useEffect(() => {
    const handleBookingMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "EVENTZEN_BOOKING_CONFIRMED") return;

      const booking = event.data?.booking;
      const bookingEventId =
        booking?.event?.eventId || booking?.event?.event_id || booking?.eventId;
      const bookingStatus = String(booking?.bookingStatus || "").toUpperCase();
      const paymentStatus = String(
        booking?.payment?.status || "",
      ).toUpperCase();

      if (
        bookingEventId === eventItem?.event_id &&
        bookingStatus === "CONFIRMED" &&
        paymentStatus === "PAID"
      ) {
        setConfirmedBooking(booking);
      }

      setBookingNotice(
        `Booking confirmed. Ticket code: ${booking?.ticket?.ticketCode || "-"}`,
      );
    };

    window.addEventListener("message", handleBookingMessage);

    return () => window.removeEventListener("message", handleBookingMessage);
  }, [eventItem?.event_id]);

  const summary = useMemo(() => {
    if (!eventItem) return null;

    const budgetLabel =
      eventItem.budget?.label ||
      [
        formatCurrency(eventItem.budget?.min_amount),
        formatCurrency(eventItem.budget?.max_amount),
      ]
        .filter((value) => value !== "-")
        .join(" - ");

    const locationLine = [
      venue?.city || eventItem.venue_snapshot?.city,
      venue?.state || eventItem.venue_snapshot?.state,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      budgetLabel: budgetLabel || "Budget on request",
      ticketPrice: isBookableEventType(eventItem.event_type)
        ? typeof eventItem.ticket_price === "number"
          ? formatCurrency(eventItem.ticket_price)
          : "Free"
        : null,
      heroImage: getEventHero(eventItem, venue),
      eventType: formatLabel(eventItem.event_type) || "Event",
      status: formatLabel(eventItem.status) || "Pending",
      venueName: pickFirstValue(
        venue?.venue_name,
        eventItem.venue_snapshot?.venue_name,
      ),
      locationLine: locationLine || "-",
      description: pickFirstValue(
        eventItem.description,
        "Event details will be shared soon.",
      ),
      guestCount: eventItem.guest_count?.toLocaleString("en-IN") || "-",
      eventDayLabel: formatDate(eventItem.event_date),
      eventTimeLabel: `${formatTime(eventItem.start_time)} - ${formatTime(eventItem.end_time)}`,
      fullAddress: pickFirstValue(
        venue?.address,
        [
          eventItem.venue_snapshot?.city,
          eventItem.venue_snapshot?.state,
          eventItem.venue_snapshot?.country,
        ]
          .filter(Boolean)
          .join(", "),
      ),
      cityStatePostal: [
        venue?.city || eventItem.venue_snapshot?.city,
        venue?.state || eventItem.venue_snapshot?.state,
      ]
        .filter(Boolean)
        .join(", "),
      country: pickFirstValue(
        venue?.country,
        eventItem.venue_snapshot?.country,
        "India",
      ),
      amenities: Array.isArray(venue?.amenities)
        ? venue.amenities
        : [eventItem.event_type, eventItem.status, venue?.venue_type].filter(
            Boolean,
          ),
    };
  }, [eventItem, venue]);

  if (loading) {
    return (
      <Layout title={isAdmin ? undefined : "Event Details"}>
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface)]">
          <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_18px_55px_rgba(5,22,28,0.08)]">
            <div className="loading loading-spinner loading-lg text-[var(--brand)]"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !eventItem || !summary) {
    return (
      <Layout title={isAdmin ? undefined : "Event Details"}>
        <div className="min-h-screen bg-[var(--surface)] px-4 py-8 md:py-10">
          <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-rose-200 bg-white p-6 shadow-[0_18px_55px_rgba(5,22,28,0.08)]">
            <div className="alert border border-rose-200 bg-rose-50 text-rose-700">
              <span>{error || "Event not found"}</span>
            </div>
            <button
              onClick={() => navigate(backTo)}
              className="admin-btn admin-btn-primary mt-5"
            >
              Back to Events
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleOpenPaymentWindow = () => {
    const popup = window.open(
      `/booking/payment?eventId=${eventItem.event_id}`,
      `eventzen-payment-${eventItem.event_id}`,
      "width=640,height=840,resizable=yes,scrollbars=yes",
    );

    if (!popup) {
      setBookingNotice("Enable popups to continue to the payment window.");
    }
  };

  const handleDownloadTicket = async () => {
    if (!confirmedBooking?.bookingId) return;

    try {
      await bookingService.downloadTicket(
        confirmedBooking.bookingId,
        `ticket-${confirmedBooking.bookingReference || eventItem.event_id}.pdf`,
      );
    } catch (downloadError) {
      console.error(downloadError);
      setBookingNotice("Ticket download failed. Please try again.");
    }
  };

  return (
    <Layout title={isAdmin ? undefined : "Event Details"}>
      <div className="relative min-h-screen bg-[var(--surface)]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.26),_transparent_65%)]" />
          <div className="absolute top-52 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.15),_transparent_72%)]" />
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="mb-7 overflow-hidden rounded-[1.9rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_24px_70px_rgba(5,22,28,0.08)]">
            <div className="h-72 w-full bg-[linear-gradient(135deg,#163744_0%,#1f5669_45%,#f0bf88_100%)] md:h-80">
              {summary.heroImage ? (
                <img
                  src={summary.heroImage}
                  alt={summary.venueName}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="p-6 md:p-8">
              {bookingNotice ? (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {bookingNotice}
                </div>
              ) : null}

              <button
                onClick={() => navigate(backTo)}
                className="admin-btn admin-btn-secondary admin-btn-sm mb-5"
              >
                Back to Events
              </button>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="mb-2 inline-flex rounded-full bg-[var(--soft)]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                    Event Profile
                  </p>
                  <h1 className="font-heading text-4xl leading-tight text-[var(--ink)] md:text-5xl">
                    {eventItem.event_name}
                  </h1>
                  <p className="mt-3 text-[var(--muted)]">
                    {summary.description}
                  </p>
                </div>

                <div className="grid min-w-[240px] gap-3">
                  {!isAdmin ? (
                    confirmedBooking ? (
                      <button
                        type="button"
                        onClick={handleDownloadTicket}
                        className="justify-self-start rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(16,101,52,0.22)] transition hover:brightness-110"
                      >
                        Download Ticket
                      </button>
                    ) : isBookableEvent ? (
                      <button
                        type="button"
                        onClick={handleOpenPaymentWindow}
                        className="justify-self-start rounded-xl bg-[var(--brand-deep)] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(17,50,61,0.2)] transition hover:opacity-95"
                      >
                        Book Now
                      </button>
                    ) : (
                      <p className="max-w-xs text-sm text-[var(--muted)]"></p>
                    )
                  ) : null}
                  <div className="rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Budget Range
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                      {summary.budgetLabel}
                    </div>
                  </div>
                  {isBookableEvent ? (
                    <div className="rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Ticket Price
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                        {summary.ticketPrice}
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-[var(--line)] bg-white/85 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Capacity
                    </div>
                    <div className="mt-1 text-lg font-semibold text-[var(--ink)]">
                      {summary.guestCount} guests
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(17,50,61,0.18)]">
                  {summary.eventType}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                  {summary.status}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                  {summary.eventDayLabel}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                  {summary.eventTimeLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <div className={panelClass}>
                <h2 className="font-heading text-2xl text-[var(--ink)]">
                  Event Information
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Event Type
                    </div>
                    <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                      {summary.eventType}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Status
                    </div>
                    <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                      {summary.status}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Event Date
                    </div>
                    <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                      {summary.eventDayLabel}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Event Time
                    </div>
                    <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                      {summary.eventTimeLabel}
                    </div>
                  </div>
                  {isBookableEvent ? (
                    <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Ticket Price
                      </div>
                      <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                        {summary.ticketPrice}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={panelClass}>
                <h2 className="font-heading text-2xl text-[var(--ink)]">
                  Venue
                </h2>
                <div className="mt-5 space-y-3 text-[var(--muted)]">
                  <p className="text-base font-semibold text-[var(--ink)]">
                    {summary.venueName}
                  </p>
                  <p>{summary.locationLine}</p>
                  <p>
                    Capacity:{" "}
                    {venue?.capacity?.toLocaleString("en-IN") ||
                      eventItem.venue_snapshot?.capacity?.toLocaleString(
                        "en-IN",
                      ) ||
                      summary.guestCount}
                  </p>
                </div>
              </div>

              <div className={panelClass}>
                <h2 className="font-heading text-2xl text-[var(--ink)]">
                  Location
                </h2>
                <div className="mt-5 space-y-3 text-[var(--muted)]">
                  <p className="text-base text-[var(--ink)]">
                    {summary.fullAddress}
                  </p>
                  <p>
                    {summary.cityStatePostal !== "-"
                      ? summary.cityStatePostal
                      : "-"}
                    {venue?.postal_code ? ` ${venue.postal_code}` : ""}
                  </p>
                  <p>{summary.country}</p>
                </div>
              </div>

              <div className={panelClass}>
                <h2 className="font-heading text-2xl text-[var(--ink)]">
                  Amenities
                </h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  {summary.amenities.length ? (
                    summary.amenities.map((amenity, index) => (
                      <span
                        key={`${amenity}-${index}`}
                        className="rounded-full border border-[var(--line)] bg-white/75 px-4 py-2 text-sm font-medium text-[var(--ink)]"
                      >
                        {formatLabel(amenity)}
                      </span>
                    ))
                  ) : (
                    <p className="text-[var(--muted)]">
                      No extra details listed.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={`${panelClass} lg:sticky lg:top-4`}>
                <h2 className="font-heading text-2xl text-[var(--ink)]">
                  Contact Details
                </h2>
                <div className="mt-5 space-y-5">
                  <DetailItem
                    label="Phone"
                    value={pickFirstValue(
                      eventItem.organizer?.phone,
                      venue?.contact_info?.phone,
                    )}
                  />
                  <DetailItem
                    label="Email"
                    value={pickFirstValue(
                      eventItem.organizer?.email,
                      venue?.contact_info?.email,
                    )}
                    breakWords
                  />
                  <DetailItem
                    label="Organizer Name"
                    value={pickFirstValue(
                      eventItem.organizer?.name,
                      venue?.contact_info?.manager_name,
                    )}
                  />
                  <DetailItem
                    label="Organization"
                    value={pickFirstValue(eventItem.organizer?.organization)}
                  />
                </div>
              </div>

              <div className={panelClass}>
                <h2 className="font-heading text-2xl text-[var(--ink)]">
                  Vendor Details
                </h2>
                <div className="mt-5 space-y-5">
                  <DetailItem
                    label="Vendor"
                    value={pickFirstValue(
                      eventItem.vendor_snapshot?.vendor_name,
                    )}
                  />
                  <DetailItem
                    label="Service Type"
                    value={pickFirstValue(
                      formatLabel(eventItem.vendor_snapshot?.service_type),
                    )}
                  />
                  <DetailItem
                    label="City"
                    value={pickFirstValue(eventItem.vendor_snapshot?.city)}
                  />
                </div>
              </div>

              {!isAdmin && location.state?.backTo !== "/events/discover" ? (
                <button
                  onClick={() => navigate(`/events/edit/${eventItem.event_id}`)}
                  className="admin-btn admin-btn-primary w-full"
                >
                  Edit Event
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default EventDetailPage;
