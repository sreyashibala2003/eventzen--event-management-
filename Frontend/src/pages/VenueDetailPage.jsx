import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { venueService } from "../api/venueVendorService";
import Footer from "../components/Footer";

const VenueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backTo = location.state?.backTo || "/venues";
  const panelClass =
    "rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_18px_55px_rgba(5,22,28,0.08)] md:p-6";

  useEffect(() => {
    fetchVenueDetails();
  }, [id]);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await venueService.getVenueById(id);
      const venueData = response.data?.venue;

      if (!venueData) {
        throw new Error("Venue details were not returned by the server");
      }

      setVenue(venueData);
    } catch (err) {
      setError("Failed to load venue details. Please try again.");
      console.error("Error fetching venue:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const formatLabel = (value) =>
    (value || "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const primaryImage =
    venue?.images?.find((image) => image.is_primary)?.url ||
    venue?.images?.[0]?.url;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface)]">
        <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_18px_55px_rgba(5,22,28,0.08)]">
          <div className="loading loading-spinner loading-lg text-[var(--brand)]"></div>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-[var(--surface)] px-4 py-8 md:py-10">
        <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-rose-200 bg-white p-6 shadow-[0_18px_55px_rgba(5,22,28,0.08)]">
          <div className="alert border border-rose-200 bg-rose-50 text-rose-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error || "Venue not found"}</span>
          </div>
          <button
            onClick={() => navigate(backTo)}
            className="admin-btn admin-btn-primary mt-5"
          >
            Back to Venues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--surface)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.26),_transparent_65%)]" />
        <div className="absolute top-52 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.15),_transparent_72%)]" />
      </div>

      <div className="container mx-auto flex-1 max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-7 overflow-hidden rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_24px_70px_rgba(5,22,28,0.08)]">
          {primaryImage && (
            <div className="h-72 w-full md:h-80">
              <img
                src={primaryImage}
                alt={venue.venue_name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="p-6 md:p-8">
            <button
              onClick={() => navigate(backTo)}
              className="admin-btn admin-btn-secondary admin-btn-sm mb-5"
            >
              Back to Venues
            </button>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex rounded-full bg-[var(--soft)]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                  Venue Profile
                </p>
                <h1 className="font-heading text-4xl leading-tight text-[var(--ink)] md:text-5xl">
                  {venue.venue_name}
                </h1>
                <p className="mt-3 max-w-3xl text-[var(--muted)]">
                  {venue.description || "No description provided."}
                </p>
              </div>
              <div className="grid min-w-[220px] gap-3">
                <div className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Price Per Day
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                    {formatPrice(venue.price_per_day)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Capacity
                  </div>
                  <div className="mt-1 text-lg font-semibold text-[var(--ink)]">
                    {venue.capacity?.toLocaleString() || "-"} guests
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(17,50,61,0.18)]">
                {formatLabel(venue.venue_type)}
              </span>
              <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                {formatLabel(venue.status)}
              </span>
              <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                {formatLabel(venue.cancellation_policy)} Cancellation
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <div className={panelClass}>
              <h2 className="font-heading text-2xl text-[var(--ink)]">
                Venue Information
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Venue Type
                  </div>
                  <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {formatLabel(venue.venue_type)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Status
                  </div>
                  <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {formatLabel(venue.status)}
                  </div>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="font-heading text-2xl text-[var(--ink)]">
                Location
              </h2>
              <div className="mt-5 space-y-3 text-[var(--muted)]">
                <p className="text-base text-[var(--ink)]">{venue.address || "-"}</p>
                <p>
                  {[venue.city, venue.state].filter(Boolean).join(", ") || "-"}
                  {venue.postal_code ? ` ${venue.postal_code}` : ""}
                </p>
                <p>{venue.country || "-"}</p>
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="font-heading text-2xl text-[var(--ink)]">
                Amenities
              </h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {venue.amenities?.length ? (
                  venue.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-[var(--line)] bg-white/75 px-4 py-2 text-sm font-medium text-[var(--ink)]"
                    >
                      {formatLabel(amenity)}
                    </span>
                  ))
                ) : (
                  <p className="text-[var(--muted)]">No amenities listed.</p>
                )}
              </div>
            </div>

            {venue.images?.length > 1 && (
              <div className={panelClass}>
                <h2 className="font-heading text-2xl text-[var(--ink)]">
                  Gallery
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
                  {venue.images.map((image, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/70"
                    >
                      <img
                        src={image.url}
                        alt={image.caption || `Venue image ${index + 1}`}
                        className="h-40 w-full object-cover"
                      />
                      <div className="p-3 text-sm text-[var(--muted)]">
                        {image.caption || `Image ${index + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className={`${panelClass} lg:sticky lg:top-4`}>
              <h2 className="font-heading text-2xl text-[var(--ink)]">
                Contact Details
              </h2>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Phone
                  </div>
                  <div className="mt-2 text-base text-[var(--ink)]">
                    {venue.contact_info?.phone || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Email
                  </div>
                  <div className="mt-2 break-all text-base text-[var(--ink)]">
                    {venue.contact_info?.email || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Manager Name
                  </div>
                  <div className="mt-2 text-base text-[var(--ink)]">
                    {venue.contact_info?.manager_name || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Website
                  </div>
                  <div className="mt-2 break-all text-base text-[var(--ink)]">
                    {venue.contact_info?.website || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VenueDetailPage;
