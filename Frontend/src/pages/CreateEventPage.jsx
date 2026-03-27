import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import UserLayout from "../components/UserLayout";
import { eventService } from "../api/eventService";
import { venueService, vendorService } from "../api/venueVendorService";
import { useAuth } from "../auth/AuthContext";
import { isBookableEventType } from "../utils/bookableEventTypes";

const eventTypes = [
  "Wedding",
  "Birthday",
  "Corporate Event",
  "Engagement",
  "Charity Event",
  "Conference",
  "Anniversary",
  "Festive Gathering",
  "Concert",
  "Sports Event",
  "Exhibition",
  "Seminar",
];

const budgetRanges = [
  "Under Rs. 50,000",
  "Rs. 50,000 - Rs. 1,00,000",
  "Rs. 1,00,000 - Rs. 3,00,000",
  "Rs. 3,00,000 - Rs. 5,00,000",
  "Above Rs. 5,00,000",
];

const budgetRangeValues = {
  "Under Rs. 50,000": { min_amount: 0, max_amount: 50000 },
  "Rs. 50,000 - Rs. 1,00,000": { min_amount: 50000, max_amount: 100000 },
  "Rs. 1,00,000 - Rs. 3,00,000": { min_amount: 100000, max_amount: 300000 },
  "Rs. 3,00,000 - Rs. 5,00,000": { min_amount: 300000, max_amount: 500000 },
  "Above Rs. 5,00,000": { min_amount: 500000, max_amount: null },
};

const inputClass =
  "mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] shadow-sm transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20";
const selectClass =
  "mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-[var(--ink)]";
const sectionClass =
  "rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_18px_55px_rgba(5,22,28,0.08)] md:p-7";
const phonePattern = /^\+?[\d\s\-()]{10,20}$/;

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

const normalizeStatus = (status) => String(status || "").toLowerCase();
const isAvailableVendor = (vendor) =>
  normalizeStatus(vendor?.status) === "available";
const isAvailableVenue = (venue) =>
  normalizeStatus(venue?.status) === "available";
const getVendorId = (vendor) =>
  vendor?.vendor_id || vendor?.id || vendor?._id || "";

const getBudgetLabel = (budget) => {
  if (budget?.label && budgetRanges.includes(budget.label)) {
    return budget.label;
  }

  const minAmount = budget?.min_amount ?? null;
  const maxAmount = budget?.max_amount ?? null;

  const matchedLabel = budgetRanges.find((label) => {
    const range = budgetRangeValues[label];
    return range.min_amount === minAmount && range.max_amount === maxAmount;
  });

  return matchedLabel || "Rs. 1,00,000 - Rs. 3,00,000";
};

const validateFormData = (formData) => {
  const errors = [];
  const showTicketPrice = isBookableEventType(formData.eventType);

  if (!formData.eventType?.trim()) {
    errors.push("Event type is required.");
  }

  if (!formData.eventDate) {
    errors.push("Event date is required.");
  }

  if (!formData.startTime) {
    errors.push("Start time is required.");
  }

  if (!formData.endTime) {
    errors.push("End time is required.");
  }

  if (
    formData.startTime &&
    formData.endTime &&
    formData.endTime <= formData.startTime
  ) {
    errors.push("Event end time must be later than start time.");
  }

  const guestCount = Number(formData.guestCount);
  if (!Number.isInteger(guestCount) || guestCount < 1) {
    errors.push("Guest count must be at least 1.");
  }

  const ticketPrice = Number(formData.ticketPrice);
  if (
    showTicketPrice &&
    (formData.ticketPrice === "" ||
      !Number.isFinite(ticketPrice) ||
      ticketPrice < 0)
  ) {
    errors.push("Ticket price must be 0 or greater.");
  }

  if (
    !formData.description?.trim() ||
    formData.description.trim().length < 10
  ) {
    errors.push("Event description must be at least 10 characters.");
  }

  if (
    !formData.organizerName?.trim() ||
    formData.organizerName.trim().length < 2
  ) {
    errors.push("Organizer name must be at least 2 characters.");
  }

  if (!formData.organizerEmail?.trim()) {
    errors.push("Organizer email is required.");
  }

  if (!phonePattern.test(formData.organizerPhone || "")) {
    errors.push(
      "Organizer phone must be 10 to 20 characters and contain only digits, spaces, +, -, or parentheses.",
    );
  }

  if (!formData.selectedVenue) {
    errors.push("Please select a venue.");
  }

  if (!formData.selectedVendor) {
    errors.push("Please select a vendor.");
  }

  return errors;
};

const formatValidationError = (error, isEditMode) => {
  const details = error?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((detail) => detail.message).join(" ");
  }

  return (
    error?.response?.data?.message ||
    `Something went wrong while ${isEditMode ? "updating" : "creating"} the event.`
  );
};

const buildEventPayload = (formData) => {
  const selectedBudget = budgetRangeValues[formData.budget];
  const showTicketPrice = isBookableEventType(formData.eventType);

  return {
    event_type: formData.eventType,
    event_date: new Date(formData.eventDate).toISOString(),
    start_time: formData.startTime,
    end_time: formData.endTime,
    guest_count: Number(formData.guestCount),
    ticket_price: showTicketPrice ? Number(formData.ticketPrice || 0) : 0,
    budget: {
      label: formData.budget,
      min_amount: selectedBudget.min_amount,
      max_amount: selectedBudget.max_amount,
      currency: "INR",
    },
    description: formData.description.trim(),
    organizer: {
      name: formData.organizerName.trim(),
      email: formData.organizerEmail.trim(),
      phone: formData.organizerPhone.trim(),
      organization: formData.organizerCompany.trim(),
    },
    assignments: {
      venue_id: formData.selectedVenue,
      vendor_id: formData.selectedVendor,
    },
    status: "confirmed",
  };
};

function CreateEventPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [venues, setVenues] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    eventType: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    guestCount: "",
    ticketPrice: "",
    budget: "",
    description: "",
    organizerName: "",
    organizerEmail: user?.email || "",
    organizerPhone: "",
    organizerCompany: "",
    selectedVenue: "",
    selectedVendor: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      organizerEmail: prev.organizerEmail || user?.email || "",
    }));
  }, [user]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        setError("");

        const [venueResponse, vendorResponse] = await Promise.all([
          venueService.getVenues({ limit: 100 }),
          vendorService.getVendors({ limit: 100 }),
        ]);

        setVenues(readVenues(venueResponse));
        setVendors(readVendors(vendorResponse));
      } catch (err) {
        setError("Unable to load venues and vendors right now.");
        console.error(err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      return undefined;
    }

    const fetchEvent = async () => {
      try {
        setLoadingEvent(true);
        setError("");
        const response = await eventService.getEventById(id);
        const eventItem = response?.data?.event;

        if (!eventItem) {
          throw new Error("Event details were not returned by the server");
        }

        setFormData({
          eventType: eventItem.event_type || "Wedding",
          eventDate: eventItem.event_date
            ? new Date(eventItem.event_date).toISOString().split("T")[0]
            : "",
          startTime: eventItem.start_time || "",
          endTime: eventItem.end_time || "",
          guestCount: eventItem.guest_count?.toString() || "",
          ticketPrice:
            eventItem.ticket_price != null
              ? eventItem.ticket_price.toString()
              : "0",
          budget: getBudgetLabel(eventItem.budget),
          description: eventItem.description || "",
          organizerName: eventItem.organizer?.name || "",
          organizerEmail: eventItem.organizer?.email || user?.email || "",
          organizerPhone: eventItem.organizer?.phone || "",
          organizerCompany: eventItem.organizer?.organization || "",
          selectedVenue: eventItem.assignments?.venue_id || "",
          selectedVendor: eventItem.assignments?.vendor_id || "",
        });
      } catch (err) {
        setError("Unable to load the event you want to edit.");
        console.error(err);
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchEvent();
  }, [id, isEditMode, user?.email]);

  const availableVenues = useMemo(() => {
    if (isEditMode) return venues;
    return venues.filter(isAvailableVenue);
  }, [isEditMode, venues]);

  const availableVendors = useMemo(() => {
    if (isEditMode) return vendors;
    return vendors.filter(isAvailableVendor);
  }, [isEditMode, vendors]);

  const showTicketPrice = useMemo(
    () => isBookableEventType(formData.eventType),
    [formData.eventType],
  );

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.venue_id === formData.selectedVenue),
    [venues, formData.selectedVenue],
  );

  const selectedVendor = useMemo(
    () =>
      vendors.find((vendor) => getVendorId(vendor) === formData.selectedVendor),
    [vendors, formData.selectedVendor],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const clientValidationErrors = validateFormData(formData);
      if (clientValidationErrors.length > 0) {
        setError(clientValidationErrors.join(" "));
        return;
      }

      const payload = buildEventPayload(formData);

      if (isEditMode) {
        await eventService.updateEvent(id, payload);
        setSuccessMessage("Event updated successfully.");
      } else {
        await eventService.createEvent(payload);
        setSuccessMessage("Event created successfully.");
      }

      navigate(isAdmin ? "/admin/events" : "/events/discover");
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setError(
          "The event service is unavailable right now. Please start the event backend and try again.",
        );
      } else {
        setError(formatValidationError(err, isEditMode));
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isAdmin) {
      navigate("/admin/events");
      return;
    }
    navigate("/dashboard");
  };

  const Layout = isAdmin ? AdminLayout : UserLayout;
  const layoutProps = isAdmin
    ? {}
    : { title: isEditMode ? "Edit Event" : "Create Event" };

  if (loadingEvent) {
    return (
      <Layout {...layoutProps}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout {...layoutProps}>
      <div className="relative min-h-full overflow-hidden bg-[var(--surface)] text-[var(--ink)]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.28),_transparent_65%)]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
          <div className="absolute left-0 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(255,247,237,0.9),_transparent_72%)]" />
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-[0_12px_32px_rgba(190,24,93,0.08)]">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-[0_12px_32px_rgba(5,150,105,0.08)]">
              {successMessage}
            </div>
          )}

          <section className="animate-rise rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                  Event Planning
                </p>
                <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                  {isEditMode ? "Edit Event" : "Create Event"}
                </h1>
                <p className="mt-3 max-w-2xl text-[var(--muted)]">
                  {isEditMode
                    ? "Update event details, assignments, and organizer information."
                    : "Define the event essentials, organizer details, and assignments."}
                </p>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className={sectionClass}>
              <div className="mb-5">
                <h2 className="font-heading text-2xl">Event Essentials</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Define the occasion, timing, audience, and budget window.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Event Type</label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                    className={selectClass}
                    required
                  >
                    <option value="" disabled>
                      Select event type
                    </option>
                    {eventTypes.map((eventType) => (
                      <option key={eventType} value={eventType}>
                        {eventType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Event Date</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Event Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={`${inputClass} no-time-placeholder`}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Event End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className={`${inputClass} no-time-placeholder`}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Number of Guests</label>
                  <input
                    type="number"
                    name="guestCount"
                    value={formData.guestCount}
                    onChange={handleChange}
                    className={inputClass}
                    min="1"
                    placeholder="Expected guest count"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Budget</label>
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className={selectClass}
                    required
                  >
                    <option value="" disabled>
                      Select budget range
                    </option>
                    {budgetRanges.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>

                {showTicketPrice ? (
                  <div>
                    <label className={labelClass}>Ticket Price</label>
                    <input
                      type="number"
                      name="ticketPrice"
                      value={formData.ticketPrice}
                      onChange={handleChange}
                      className={inputClass}
                      min="0"
                      step="0.01"
                      placeholder="Price per ticket"
                      required
                    />
                  </div>
                ) : null}
              </div>
            </section>

            <section className={sectionClass}>
              <div className="mb-5">
                <h2 className="font-heading text-2xl">Event Brief</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Share the style, preferences, and operational notes.
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className={labelClass}>Event Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`${inputClass} min-h-32 resize-y`}
                    placeholder="Describe the event vision, theme, flow, or expected ambience."
                    minLength={10}
                    required
                  />
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="mb-5">
                <h2 className="font-heading text-2xl">
                  Organizer Contact Details
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Keep the primary decision-maker details attached to the event.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Organizer Name</label>
                  <input
                    type="text"
                    name="organizerName"
                    value={formData.organizerName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Full name"
                    minLength={2}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Organizer Email</label>
                  <input
                    type="email"
                    name="organizerEmail"
                    value={formData.organizerEmail}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Organizer Phone</label>
                  <input
                    type="tel"
                    name="organizerPhone"
                    value={formData.organizerPhone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+91 98765 43210"
                    pattern="^\+?[\d\s\-()]{10,20}$"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Organization</label>
                  <input
                    type="text"
                    name="organizerCompany"
                    value={formData.organizerCompany}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Company name / Host name"
                  />
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="mb-5">
                <h2 className="font-heading text-2xl">Assignments</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Match the event with the best available venue and vendor.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    {isEditMode ? "Venue" : "Available Venue"}
                  </label>
                  <select
                    name="selectedVenue"
                    value={formData.selectedVenue}
                    onChange={handleChange}
                    className={selectClass}
                    required
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions
                        ? "Loading venues..."
                        : `Select ${isEditMode ? "a venue" : "an available venue"}`}
                    </option>
                    {availableVenues.map((venue) => (
                      <option key={venue.venue_id} value={venue.venue_id}>
                        {venue.venue_name} - {venue.city}
                      </option>
                    ))}
                  </select>
                  {selectedVenue && (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Capacity {selectedVenue.capacity} guests,{" "}
                      {selectedVenue.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    {isEditMode ? "Vendor" : "Available Vendor"}
                  </label>
                  <select
                    name="selectedVendor"
                    value={formData.selectedVendor}
                    onChange={handleChange}
                    className={selectClass}
                    required
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions
                        ? "Loading vendors..."
                        : `Select ${isEditMode ? "a vendor" : "an available vendor"}`}
                    </option>
                    {availableVendors.map((vendor) => (
                      <option
                        key={getVendorId(vendor)}
                        value={getVendorId(vendor)}
                      >
                        {vendor.vendor_name} -{" "}
                        {vendor.service_type
                          ?.split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1),
                          )
                          .join(" ")}
                      </option>
                    ))}
                  </select>
                  {selectedVendor && (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {selectedVendor.address?.city} -{" "}
                      {(
                        selectedVendor.pricing?.price_per_day ??
                        selectedVendor.pricing?.base_price_range?.min ??
                        0
                      ).toLocaleString("en-IN")}{" "}
                      per day
                    </p>
                  )}
                </div>
              </div>
            </section>

            <div className="sticky bottom-4 z-10 flex justify-end gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/95 p-4 shadow-[0_18px_45px_rgba(5,22,28,0.14)] backdrop-blur">
              <button
                type="button"
                onClick={handleCancel}
                className="admin-btn admin-btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={submitting || loadingOptions}
              >
                {submitting
                  ? isEditMode
                    ? "Updating Event..."
                    : "Creating Event..."
                  : isEditMode
                    ? "Update Event"
                    : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default CreateEventPage;
