import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { vendorService } from "../api/venueVendorService";
import AdminLayout from "../components/AdminLayout";

const AdminVendorsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, [location.key]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getVendors({ limit: 100 });
      const vendorsData =
        response.vendors || response.data?.vendors || response.data || [];
      setVendors(vendorsData);
    } catch (err) {
      setError("Failed to load vendors");
      console.error("Error fetching vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendorId, vendorName) => {
    if (!confirm(`Are you sure you want to delete "${vendorName}"?`)) {
      return;
    }

    try {
      setDeleteLoading(vendorId);
      await vendorService.deleteVendor(vendorId);
      setVendors(vendors.filter((vendor) => vendor.vendor_id !== vendorId));
      alert("Vendor deleted successfully");
    } catch (err) {
      alert(
        "Failed to delete vendor: " +
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

  const formatServiceType = (type) => {
    return type
      ?.split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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

  const serviceTypeCount = new Set(
    vendors.map((vendor) => vendor.service_type).filter(Boolean),
  ).size;

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
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
        </div>

        <section className="animate-rise mb-7 rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Vendor Operations
              </p>
              <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                Manage Vendors
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Update vendor profiles and keep marketplace listings current.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchVendors}
                className="admin-btn admin-btn-secondary"
              >
                Refresh
              </button>
              <button
                onClick={() => navigate("/admin/vendors/new")}
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
                Add New Vendor
              </button>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Total Vendors
            </p>
            <p className="mt-3 font-heading text-4xl">{vendors.length}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Across all service types
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Available Vendors
            </p>
            <p className="mt-3 font-heading text-4xl text-emerald-700">
              {vendors.filter((vendor) => vendor.status === "available").length}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Available for hire
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_12px_36px_rgba(5,22,28,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Service Types
            </p>
            <p className="mt-3 font-heading text-4xl text-sky-700">
              {serviceTypeCount}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Categories in the marketplace
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
            <h2 className="font-heading text-2xl">Vendor Directory</h2>
            <p className="text-sm text-[var(--muted)]">
              Showing {vendors.length} results
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white/70">
            <table className="table table-zebra text-sm [&_th]:px-6 [&_th]:py-4 [&_th]:font-semibold [&_td]:px-6 [&_td]:py-5 [&_td]:align-middle">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--paper)]/80 text-[0.72rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="min-w-[16rem]">Vendor Name</th>
                  <th className="min-w-[10rem]">Service Type</th>
                  <th className="min-w-[9rem]">Location</th>
                  <th className="min-w-[11rem]">Price Per Day</th>
                  <th className="min-w-[9rem]">Status</th>
                  <th className="min-w-[10rem] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-10 text-center text-[var(--muted)]"
                    >
                      No vendors found. Add your first vendor!
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.vendor_id} className="hover">
                      <td className="font-medium text-[var(--ink)]">
                        <div>
                          <div className="font-semibold">
                            {vendor.vendor_name}
                          </div>
                          {vendor.business_name &&
                            vendor.business_name !== vendor.vendor_name && (
                              <div className="text-xs text-gray-500 italic">
                                {vendor.business_name}
                              </div>
                            )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {formatServiceType(vendor.service_type)}
                        </span>
                      </td>
                      <td className="text-[var(--muted)]">
                        {vendor.address?.city}
                      </td>
                      <td className="text-[var(--muted)]">
                        {formatPrice(
                          vendor.pricing?.price_per_day ??
                            vendor.pricing?.base_price_range?.min ??
                            0,
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(vendor.status)}`}
                        >
                          {formatStatusLabel(vendor.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/vendors/${vendor.vendor_id}`, {
                                state: { fromAdmin: true, backTo: "/admin/vendors" },
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
                              navigate(`/admin/vendors/edit/${vendor.vendor_id}`)
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
                              handleDelete(vendor.vendor_id, vendor.vendor_name)
                            }
                            className="admin-btn admin-btn-danger admin-btn-sm admin-btn-icon"
                            disabled={deleteLoading === vendor.vendor_id}
                            title="Delete"
                          >
                            {deleteLoading === vendor.vendor_id ? (
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

export default AdminVendorsPage;
