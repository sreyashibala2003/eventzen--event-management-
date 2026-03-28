import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { vendorService } from "../api/venueVendorService";
import Footer from "./Footer";

const VendorList = ({ showFooter = true, fullHeight = true }) => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchVendors();
  }, [page]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vendorService.getVendors({ page, limit: 12 });
      setVendors(response?.data?.vendors || []);
      setPagination(response?.data?.pagination || {});
    } catch (err) {
      setError("Failed to fetch vendors. Please try again.");
      console.error("Error fetching vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
  };

  const formatServiceType = (type = "") =>
    type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const availableVendors = vendors.filter(
    (vendor) => vendor.status === "available",
  );
  const serviceTypes = new Set(
    vendors
      .map((vendor) => formatServiceType(vendor.service_type))
      .filter(Boolean),
  ).size;

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${
          fullHeight ? "min-h-screen" : "min-h-[40vh]"
        }`}
      >
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col overflow-hidden bg-[var(--surface)] text-[var(--ink)] ${
        fullHeight ? "min-h-screen" : "min-h-full"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.26),_transparent_65%)]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
      </div>

      <div className="container mx-auto flex-1 max-w-6xl px-4 py-8 md:py-10">
        <section className="animate-rise mb-7 rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Vendor Marketplace
              </p>
              <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                Explore Vendors
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Discover trusted event professionals across catering,
                decoration, entertainment, photography, and more.
              </p>
            </div>
            <button
              onClick={fetchVendors}
              className="admin-btn admin-btn-secondary"
            >
              Refresh List
            </button>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Total Vendors
            </p>
            <p className="mt-3 font-heading text-4xl">
              {pagination.total || vendors.length}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Service partners ready to review
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Available Vendors
            </p>
            <p className="mt-3 font-heading text-4xl text-emerald-700">
              {availableVendors.length}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ready to take new event bookings
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Service Types
            </p>
            <p className="mt-3 font-heading text-4xl text-sky-700">
              {serviceTypes}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Categories represented on this page
            </p>
          </article>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor) => (
            <article
              key={vendor.vendor_id}
              className="group overflow-hidden rounded-[1.7rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_18px_55px_rgba(5,22,28,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(5,22,28,0.14)]"
            >
              <div className="bg-[linear-gradient(135deg,rgba(23,73,89,0.98),rgba(17,50,61,0.92),rgba(246,216,184,0.5))] px-5 py-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="rounded-full bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur w-fit">
                      {formatServiceType(vendor.service_type)}
                    </p>
                    <h2 className="mt-3 font-heading text-2xl leading-tight">
                      {vendor.vendor_name}
                    </h2>
                    {vendor.business_name &&
                      vendor.business_name !== vendor.vendor_name && (
                        <p className="mt-1 text-sm text-white/75">
                          {vendor.business_name}
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-3">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Location
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--ink)]">
                      {vendor.address?.city || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-3">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Price Per Day
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--ink)]">
                      {formatPrice(
                        vendor.pricing?.price_per_day ??
                          vendor.pricing?.base_price_range?.min ??
                          0,
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  Standard vendor rate is{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    {formatPrice(
                      vendor.pricing?.price_per_day ??
                        vendor.pricing?.base_price_range?.min ??
                        0,
                    )}
                  </span>{" "}
                  per day.
                </p>

                {vendor.service_subcategory?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {vendor.service_subcategory
                      .slice(0, 4)
                      .map((subcategory, index) => (
                        <span
                          key={`${vendor.vendor_id}-${index}`}
                          className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)]"
                        >
                          {subcategory}
                        </span>
                      ))}
                    {vendor.service_subcategory.length > 4 && (
                      <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                        +{vendor.service_subcategory.length - 4} more
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => navigate(`/vendors/${vendor.vendor_id}`)}
                    className="admin-btn admin-btn-primary flex-1"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </article>
          ))}
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
      {showFooter ? <Footer /> : null}
    </div>
  );
};

export default VendorList;
