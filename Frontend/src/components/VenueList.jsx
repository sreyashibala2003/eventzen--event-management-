import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { venueService } from "../api/venueVendorService";
import Footer from "./Footer";

const VenueList = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchVenues();
  }, [page]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await venueService.getVenues({ page, limit: 12 });
      setVenues(response?.data?.venues || []);
      setPagination(response?.data?.pagination || {});
    } catch (err) {
      setError("Failed to fetch venues. Please try again.");
      console.error("Error fetching venues:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const formatVenueType = (type = "") =>
    type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const availableVenues = venues.filter(
    (venue) => venue.status === "available",
  );
  const totalCapacity = venues.reduce(
    (sum, venue) => sum + Number(venue.capacity || 0),
    0,
  );
  const averagePrice = venues.length
    ? Math.round(
        venues.reduce(
          (sum, venue) => sum + Number(venue.price_per_day || 0),
          0,
        ) / venues.length,
      )
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--surface)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.26),_transparent_65%)]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
      </div>

      <div className="container mx-auto flex-1 max-w-6xl px-4 py-8 md:py-10">
        <section className="animate-rise mb-7 rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Venue Discovery
              </p>
              <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                Explore Venues
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Browse polished venue options for weddings, parties, corporate
                functions, and celebrations of every scale.
              </p>
            </div>
            <button
              onClick={fetchVenues}
              className="admin-btn admin-btn-secondary"
            >
              Refresh List
            </button>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Total Venues
            </p>
            <p className="mt-3 font-heading text-4xl">
              {pagination.total || venues.length}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Curated spaces available to browse
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Available Now
            </p>
            <p className="mt-3 font-heading text-4xl text-emerald-700">
              {availableVenues.length}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ready for event planning
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Average Price
            </p>
            <p className="mt-3 font-heading text-4xl text-sky-700">
              {formatPrice(averagePrice)}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Typical per-day booking rate
            </p>
          </article>
        </div>
        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => {
            const heroImage =
              venue.images?.find((img) => img.is_primary)?.url ||
              venue.images?.[0]?.url;

            return (
              <article
                key={venue.venue_id}
                className="group overflow-hidden rounded-[1.7rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_18px_55px_rgba(5,22,28,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(5,22,28,0.14)]"
              >
                <div className="relative h-56 overflow-hidden">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt={venue.venue_name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(23,73,89,0.12),rgba(246,216,184,0.45))]">
                      <span className="text-sm font-medium text-[var(--muted)]">
                        Venue Preview Unavailable
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(17,50,61,0.82)] to-transparent" />
                  <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-deep)] backdrop-blur">
                      {formatVenueType(venue.venue_type)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                        venue.status === "available"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {venue.status || "Status Pending"}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="font-heading text-2xl leading-tight">
                      {venue.venue_name}
                    </p>
                    <p className="mt-1 text-sm text-white/80">
                      {venue.city}, {venue.state}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-3">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                        Capacity
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
                        {Number(venue.capacity || 0).toLocaleString()} guests
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-3">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                        Price Per Day
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
                        {formatPrice(venue.price_per_day)}
                      </p>
                    </div>
                  </div>

                  {venue.amenities?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {venue.amenities.slice(0, 4).map((amenity, index) => (
                        <span
                          key={`${venue.venue_id}-${index}`}
                          className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)]"
                        >
                          {amenity.replace(/_/g, " ")}
                        </span>
                      ))}
                      {venue.amenities.length > 4 && (
                        <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                          +{venue.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => navigate(`/venues/${venue.venue_id}`)}
                      className="admin-btn admin-btn-primary flex-1"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {pagination.pages > 1 && (
          <div className="flex justify-center">
            <div className="join rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-1 shadow-[0_12px_30px_rgba(5,22,28,0.08)]">
              <button
                className="join-item admin-btn admin-btn-secondary min-h-[2.75rem]"
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>

              {[...Array(pagination.pages)].map((_, index) => {
                const pageNum = index + 1;
                const isCurrentPage = pageNum === pagination.page;

                if (
                  pageNum === 1 ||
                  pageNum === pagination.pages ||
                  Math.abs(pageNum - pagination.page) <= 1
                ) {
                  return (
                    <button
                      key={pageNum}
                      className={`join-item admin-btn min-h-[2.75rem] ${
                        isCurrentPage
                          ? "admin-btn-primary"
                          : "admin-btn-secondary"
                      }`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                }

                if (
                  (pageNum === 2 && pagination.page > 4) ||
                  (pageNum === pagination.pages - 1 &&
                    pagination.page < pagination.pages - 3)
                ) {
                  return (
                    <button
                      key={pageNum}
                      className="join-item admin-btn admin-btn-soft min-h-[2.75rem]"
                      disabled
                    >
                      ...
                    </button>
                  );
                }

                return null;
              })}

              <button
                className="join-item admin-btn admin-btn-secondary min-h-[2.75rem]"
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default VenueList;
