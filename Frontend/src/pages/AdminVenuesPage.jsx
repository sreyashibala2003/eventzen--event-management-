import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { venueService } from "../api/venueVendorService";
import AdminLayout from "../components/AdminLayout";

const AdminVenuesPage = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await venueService.getVenues({ limit: 100 });
      setVenues(response.data.venues);
    } catch (err) {
      setError("Failed to load venues");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (venueId, venueName) => {
    if (!confirm(`Are you sure you want to delete "${venueName}"?`)) {
      return;
    }

    try {
      setDeleteLoading(venueId);
      await venueService.deleteVenue(venueId);
      setVenues(venues.filter((v) => v.venue_id !== venueId));
      alert("Venue deleted successfully");
    } catch (err) {
      alert(
        "Failed to delete venue: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatStatusLabel = (status) => {
    return status
      ?.split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusBadgeClass = (status) => {
    if (status === "available") return "badge-success";
    if (status === "unavailable") return "badge-error";
    return "badge-info";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
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
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
        </div>

        <section className="animate-rise mb-7 rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Venue Operations
              </p>
              <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                Manage Venues
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Maintain venue inventory, monitor availability, and keep listing
                details current.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchVenues}
                className="admin-btn admin-btn-secondary"
              >
                Refresh
              </button>
              <button
                onClick={() => navigate("/admin/venues/new")}
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
                Add New Venue
              </button>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Total Venues
            </p>
            <p className="mt-3 font-heading text-4xl">{venues.length}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Across all locations
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Available Venues
            </p>
            <p className="mt-3 font-heading text-4xl text-emerald-700">
              {venues.filter((v) => v.status === "available").length}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Available for booking
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Total Capacity
            </p>
            <p className="mt-3 font-heading text-4xl text-sky-700">
              {venues
                .reduce((sum, v) => sum + (v.capacity || 0), 0)
                .toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Combined guest capacity
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
            <h2 className="font-heading text-2xl">Venue Directory</h2>
            <p className="text-sm text-[var(--muted)]">
              Showing {venues.length} results
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white/70">
            <table className="table table-zebra text-sm [&_th]:px-6 [&_th]:py-4 [&_th]:font-semibold [&_td]:px-6 [&_td]:py-5 [&_td]:align-middle">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--paper)]/80 text-[0.72rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="min-w-[16rem]">Venue Name</th>
                  <th className="min-w-[11rem]">Location</th>
                  <th className="min-w-[9rem]">Type</th>
                  <th className="min-w-[10rem]">Capacity</th>
                  <th className="min-w-[10rem]">Price/Day</th>
                  <th className="min-w-[9rem]">Status</th>
                  <th className="min-w-[10rem] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {venues.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-10 text-center text-[var(--muted)]"
                    >
                      No venues found. Add your first venue!
                    </td>
                  </tr>
                ) : (
                  venues.map((venue) => (
                    <tr key={venue.venue_id} className="hover">
                      <td className="font-medium text-[var(--ink)]">
                        <div className="font-semibold">{venue.venue_name}</div>
                      </td>
                      <td className="text-[var(--muted)]">
                        {venue.city}, {venue.state}
                      </td>
                      <td>
                        <span className="badge badge-outline capitalize">
                          {venue.venue_type?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-[var(--muted)]">
                        {venue.capacity?.toLocaleString()} guests
                      </td>
                      <td className="text-[var(--muted)]">
                        {formatPrice(venue.price_per_day)}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(venue.status)}`}
                        >
                          {formatStatusLabel(venue.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/venues/${venue.venue_id}`, {
                                state: {
                                  fromAdmin: true,
                                  backTo: "/admin/venues",
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
                              navigate(`/admin/venues/edit/${venue.venue_id}`)
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
                            onClick={() =>
                              handleDelete(venue.venue_id, venue.venue_name)
                            }
                            className="admin-btn admin-btn-danger admin-btn-sm admin-btn-icon"
                            disabled={deleteLoading === venue.venue_id}
                            title="Delete"
                          >
                            {deleteLoading === venue.venue_id ? (
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
};

export default AdminVenuesPage;
