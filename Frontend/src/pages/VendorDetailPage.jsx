import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { vendorService } from "../api/venueVendorService";
import Footer from "../components/Footer";

const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backTo = location.state?.backTo || "/vendors";
  const panelClass =
    "rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_18px_55px_rgba(5,22,28,0.08)] md:p-6";

  useEffect(() => {
    fetchVendorDetails();
  }, [id]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await vendorService.getVendorById(id);
      const vendorData = response.data?.vendor;

      if (!vendorData) {
        throw new Error("Vendor details were not returned by the server");
      }

      setVendor(vendorData);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please login to view vendor details.");
      } else {
        setError("Failed to load vendor details. Please try again.");
      }
      console.error("Error fetching vendor:", err);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface)]">
        <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_18px_55px_rgba(5,22,28,0.08)]">
          <div className="loading loading-spinner loading-lg text-[var(--brand)]"></div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
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
            <span>{error || "Vendor not found"}</span>
          </div>
          <button
            onClick={() => navigate(error?.includes("login") ? "/login" : backTo)}
            className="admin-btn admin-btn-primary mt-5"
          >
            {error?.includes("login") ? "Go to Login" : "Back to Vendors"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--surface)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.26),_transparent_65%)]" />
        <div className="absolute top-52 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.15),_transparent_72%)]" />
      </div>

      <div className="container mx-auto flex-1 max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-7 rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
          <button
            onClick={() => navigate(backTo)}
            className="admin-btn admin-btn-secondary admin-btn-sm mb-5"
          >
            Back to Vendors
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-[var(--soft)]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Vendor Profile
              </p>
              <h1 className="font-heading text-4xl leading-tight text-[var(--ink)] md:text-5xl">
                {vendor.vendor_name}
              </h1>
              {vendor.business_name &&
                vendor.business_name !== vendor.vendor_name && (
                  <p className="mt-2 text-lg text-[var(--muted)]">
                    {vendor.business_name}
                  </p>
                )}
            </div>
            <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/80 px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Price Per Day
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                {formatPrice(
                  vendor.pricing?.price_per_day ??
                    vendor.pricing?.base_price_range?.min,
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(17,50,61,0.18)]">
              {formatLabel(vendor.service_type)}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]">
              {formatLabel(vendor.status)}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink)]">
              {vendor.pricing?.currency ??
                vendor.pricing?.base_price_range?.currency ??
                "INR"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-6">
            <div className={panelClass}>
              <h2 className="font-heading text-2xl text-[var(--ink)]">
                Vendor Information
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Vendor Name
                  </div>
                  <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {vendor.vendor_name || "-"}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Business Name
                  </div>
                  <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {vendor.business_name || "-"}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Service Type
                  </div>
                  <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {formatLabel(vendor.service_type)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Status
                  </div>
                  <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {formatLabel(vendor.status)}
                  </div>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="font-heading text-2xl text-[var(--ink)]">
                Service Area
              </h2>
              <div className="mt-5 space-y-3 text-[var(--muted)]">
                <p className="text-base text-[var(--ink)]">
                  {[vendor.address?.city, vendor.address?.state]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
                <p>{vendor.address?.country || "-"}</p>
              </div>
            </div>

            <div className={panelClass}>
              <h2 className="font-heading text-2xl text-[var(--ink)]">
                Pricing
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Price Per Day
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[var(--ink)]">
                    {formatPrice(
                      vendor.pricing?.price_per_day ??
                        vendor.pricing?.base_price_range?.min,
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Currency
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[var(--ink)]">
                    {vendor.pricing?.currency ??
                      vendor.pricing?.base_price_range?.currency ??
                      "INR"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${panelClass} lg:sticky lg:top-4`}>
              <h2 className="font-heading text-2xl text-[var(--ink)]">
                Contact Details
              </h2>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Primary Email
                  </div>
                  <div className="mt-2 break-all text-base text-[var(--ink)]">
                    {vendor.contact_info?.primary_email || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Primary Phone
                  </div>
                  <div className="mt-2 text-base text-[var(--ink)]">
                    {vendor.contact_info?.primary_phone || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Website
                  </div>
                  <div className="mt-2 break-all text-base text-[var(--ink)]">
                    {vendor.contact_info?.website || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Currency
                  </div>
                  <div className="mt-2 text-base text-[var(--ink)]">
                    {vendor.pricing?.currency ??
                      vendor.pricing?.base_price_range?.currency ??
                      "INR"}
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

export default VendorDetailPage;
