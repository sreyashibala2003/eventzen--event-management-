import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { bookingService } from "../api/bookingService";
import { eventService } from "../api/eventService";
import { venueService, vendorService } from "../api/venueVendorService";

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

const formatCurrency = (amount) => {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return null;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const readVenues = (response) => {
  const venues =
    response?.data?.venues || response?.venues || response?.data || [];
  return Array.isArray(venues) ? venues : [];
};

const readVendors = (response) => {
  const vendors =
    response?.data?.vendors || response?.vendors || response?.data || [];
  return Array.isArray(vendors) ? vendors : [];
};

const readBookings = (response) => {
  const bookings =
    response?.data?.bookings || response?.bookings || response?.data || [];
  return Array.isArray(bookings) ? bookings : [];
};

const getVendorId = (vendor) => vendor?.vendor_id || vendor?.id || vendor?._id;

const getBookingEventId = (booking) =>
  booking?.event?.eventId || booking?.event?.event_id || booking?.eventId;

const isConfirmedPaidBooking = (booking) => {
  const paymentStatus = String(booking?.payment?.status || "").toUpperCase();
  const bookingStatus = String(booking?.bookingStatus || "").toUpperCase();

  if (paymentStatus !== "PAID") {
    return false;
  }

  return !bookingStatus || bookingStatus === "CONFIRMED";
};

const getVenuePrice = (eventItem, venueMap) => {
  const assignedVenueId =
    eventItem.assignments?.venue_id || eventItem.venue_snapshot?.venue_id;
  const assignedVenue = assignedVenueId ? venueMap.get(assignedVenueId) : null;

  const rawValue =
    eventItem.venue_snapshot?.price_per_day ?? assignedVenue?.price_per_day;
  const numericValue = Number(rawValue);

  return Number.isFinite(numericValue) ? numericValue : null;
};

const getVendorPrice = (eventItem, vendorMap) => {
  const assignedVendorId =
    eventItem.assignments?.vendor_id || eventItem.vendor_snapshot?.vendor_id;
  const assignedVendor = assignedVendorId
    ? vendorMap.get(assignedVendorId)
    : null;

  const rawValue =
    eventItem.vendor_snapshot?.pricing?.price_per_day ??
    eventItem.vendor_snapshot?.price_per_day ??
    assignedVendor?.pricing?.price_per_day ??
    assignedVendor?.pricing?.base_price_range?.min;
  const numericValue = Number(rawValue);

  return Number.isFinite(numericValue) ? numericValue : null;
};

const getTicketPrice = (eventItem) => {
  const numericValue = Number(eventItem?.ticket_price);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const getBookingAmount = (booking, fallbackTicketPrice) => {
  const amountCandidates = [
    booking?.payment?.amount,
    booking?.payment?.paidAmount,
    booking?.payment?.amountPaid,
    booking?.payment?.totalAmount,
    booking?.amount,
    booking?.totalAmount,
  ];

  for (const candidate of amountCandidates) {
    const numericValue = Number(candidate);

    if (Number.isFinite(numericValue) && numericValue >= 0) {
      return numericValue;
    }
  }

  const quantityCandidates = [
    booking?.ticketQuantity,
    booking?.quantity,
    booking?.ticketsBooked,
    booking?.ticket_count,
    booking?.tickets_count,
  ];
  const resolvedQuantity = quantityCandidates
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0);

  if (Number.isFinite(fallbackTicketPrice) && fallbackTicketPrice >= 0) {
    return fallbackTicketPrice * (resolvedQuantity || 1);
  }

  return 0;
};

const formatBudgetRange = (budget) => {
  if (!budget) {
    return "Budget not defined";
  }

  if (budget.label) {
    return budget.label;
  }

  const minAmount = formatCurrency(budget.min_amount);
  const maxAmount = formatCurrency(budget.max_amount);

  if (minAmount && maxAmount) {
    return `${minAmount} - ${maxAmount}`;
  }

  if (minAmount) {
    return `${minAmount}+`;
  }

  if (maxAmount) {
    return `Up to ${maxAmount}`;
  }

  return "Budget not defined";
};

function AdminBudgetManagementPage() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const [eventResponse, venueResponse, vendorResponse, bookingResponse] =
          await Promise.all([
            eventService.getEvents({
              limit: 100,
              sort: "-event_date",
            }),
            venueService.getVenues({ limit: 100 }),
            vendorService.getVendors({ limit: 100 }),
            bookingService.getAdminBookings({ limit: 500 }),
          ]);
        setEvents(eventResponse?.data?.events || []);
        setVenues(readVenues(venueResponse));
        setVendors(readVendors(vendorResponse));
        setBookings(readBookings(bookingResponse));
      } catch (err) {
        console.error("Unable to load event budgets", err);
        setError("Unable to load event budgets right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const budgetedEvents = useMemo(
    () =>
      events.filter(
        (eventItem) =>
          eventItem.budget?.label ||
          typeof eventItem.budget?.min_amount === "number" ||
          typeof eventItem.budget?.max_amount === "number",
      ),
    [events],
  );

  const totalMinimumBudget = useMemo(
    () =>
      budgetedEvents.reduce(
        (sum, eventItem) => sum + (Number(eventItem.budget?.min_amount) || 0),
        0,
      ),
    [budgetedEvents],
  );

  const highestBudgetEvent = useMemo(() => {
    if (budgetedEvents.length === 0) {
      return null;
    }

    return [...budgetedEvents].sort((left, right) => {
      const leftValue =
        left.budget?.max_amount ?? left.budget?.min_amount ?? -1;
      const rightValue =
        right.budget?.max_amount ?? right.budget?.min_amount ?? -1;
      return rightValue - leftValue;
    })[0];
  }, [budgetedEvents]);

  const venueMap = useMemo(
    () => new Map(venues.map((venue) => [venue.venue_id, venue])),
    [venues],
  );

  const vendorMap = useMemo(
    () => new Map(vendors.map((vendor) => [getVendorId(vendor), vendor])),
    [vendors],
  );

  const eventMap = useMemo(
    () => new Map(events.map((eventItem) => [eventItem.event_id, eventItem])),
    [events],
  );

  const ticketsSoldAmountByEvent = useMemo(() => {
    return bookings.reduce((amountMap, booking) => {
      if (!isConfirmedPaidBooking(booking)) {
        return amountMap;
      }

      const eventId = getBookingEventId(booking);

      if (!eventId) {
        return amountMap;
      }

      const matchedEvent = eventMap.get(eventId);
      const ticketPrice = getTicketPrice(matchedEvent);
      const bookingAmount = getBookingAmount(booking, ticketPrice);

      amountMap.set(eventId, (amountMap.get(eventId) || 0) + bookingAmount);
      return amountMap;
    }, new Map());
  }, [bookings, eventMap]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="relative container mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.26),_transparent_65%)]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
        </div>

        <section className="animate-rise mb-7 rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
          <div>
            <div>
              <p className="mb-2 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Budget Management
              </p>
              <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                Event Budget Overview
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Review the event-wise budget windows selected during event
                creation and jump straight into the corresponding event record.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        <section className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_18px_55px_rgba(5,22,28,0.08)] md:p-6">
          <div className="mb-4">
            <div>
              <h2 className="font-heading text-2xl">Budget Directory</h2>
              <p className="text-sm text-[var(--muted)]">
                Showing the event budget range alongside ticket sales and
                assigned venue and vendor prices
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white/70">
            <table className="table table-zebra text-sm [&_th]:px-6 [&_th]:py-4 [&_th]:font-semibold [&_td]:px-6 [&_td]:py-5 [&_td]:align-middle">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--paper)]/80 text-[0.72rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="min-w-[16rem]">Event</th>
                  <th className="min-w-[11rem]">Date</th>
                  <th className="min-w-[14rem]">Organizer</th>
                  <th className="min-w-[14rem]">Budget Range</th>
                  <th className="min-w-[10rem]">Venue Price</th>
                  <th className="min-w-[10rem]">Vendor Price</th>
                  <th className="min-w-[10rem]">Ticket Price</th>
                  <th className="min-w-[10rem]">Tickets Sold</th>
                </tr>
              </thead>
              <tbody>
                {budgetedEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-10 text-center text-[var(--muted)]"
                    >
                      No event budgets have been defined yet.
                    </td>
                  </tr>
                ) : (
                  budgetedEvents.map((eventItem) => (
                    <tr key={eventItem.event_id} className="hover">
                      <td className="font-medium text-[var(--ink)]">
                        <div className="font-semibold">
                          {eventItem.event_name || eventItem.event_type}
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          {eventItem.event_type}
                        </div>
                      </td>
                      <td className="text-[var(--muted)]">
                        {formatDate(eventItem.event_date)}
                      </td>
                      <td className="text-[var(--muted)]">
                        <div>
                          {eventItem.organizer?.name || "Unknown organizer"}
                        </div>
                        <div className="text-xs">
                          {eventItem.organizer?.email || "No email available"}
                        </div>
                      </td>
                      <td className="text-[var(--ink)]">
                        {formatBudgetRange(eventItem.budget)}
                      </td>

                      <td className="text-[var(--muted)]">
                        {formatCurrency(getVenuePrice(eventItem, venueMap)) ||
                          "N/A"}
                      </td>
                      <td className="text-[var(--muted)]">
                        {formatCurrency(getVendorPrice(eventItem, vendorMap)) ||
                          "N/A"}
                      </td>
                      <td className="text-[var(--muted)]">
                        {formatCurrency(getTicketPrice(eventItem)) ||
                          "Free / N/A"}
                      </td>
                      <td className="text-[var(--muted)]">
                        {formatCurrency(
                          ticketsSoldAmountByEvent.get(eventItem.event_id) || 0,
                        ) || formatCurrency(0)}
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

export default AdminBudgetManagementPage;
