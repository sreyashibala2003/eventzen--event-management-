import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vendorService } from "../api/venueVendorService";
import AdminLayout from "../components/AdminLayout";

const VendorFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const sectionClass =
    "card border border-[var(--line)] bg-[var(--paper)] shadow-[0_18px_55px_rgba(5,22,28,0.08)]";
  const sectionBodyClass = "card-body p-5 md:p-7";
  const inputClass =
    "mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] shadow-sm transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 disabled:bg-slate-100 disabled:text-slate-500";
  const selectClass =
    "mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    vendor_name: "",
    business_name: "",
    service_type: "",
    contact_info: {
      primary_email: "",
      primary_phone: "",
      website: "",
    },
    address: {
      city: "",
      state: "",
      country: "India",
    },
    pricing: {
      price_per_day: "",
      currency: "INR",
    },
    status: "",
  });

  const serviceTypes = [
    "catering",
    "decoration",
    "photography",
    "videography",
    "music_dj",
    "live_band",
    "lighting",
    "sound_system",
    "security",
    "transport",
    "florist",
    "cake_bakery",
    "event_planning",
    "mc_host",
    "entertainment",
    "rental_equipment",
    "makeup_artist",
    "mehendi_artist",
    "cleaning_services",
  ];

  useEffect(() => {
    if (isEdit) {
      fetchVendor();
    }
  }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getVendorById(id);
      const vendor = response.data?.vendor;

      if (!vendor) {
        throw new Error("Vendor details were not returned by the server");
      }

      setFormData({
        vendor_name: vendor.vendor_name || "",
        business_name: vendor.business_name || "",
        service_type: vendor.service_type || "",
        contact_info: {
          primary_email: vendor.contact_info?.primary_email || "",
          primary_phone: vendor.contact_info?.primary_phone || "",
          website: vendor.contact_info?.website || "",
        },
        address: {
          city: vendor.address?.city || "",
          state: vendor.address?.state || "",
          country: vendor.address?.country || "India",
        },
        pricing: {
          price_per_day:
            vendor.pricing?.price_per_day ??
            vendor.pricing?.base_price_range?.min ??
            "",
          currency:
            vendor.pricing?.currency ??
            vendor.pricing?.base_price_range?.currency ??
            "INR",
        },
        status: vendor.status || "",
      });
    } catch (err) {
      setError("Failed to load vendor details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split(".");

    if (keys.length === 1) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (keys.length === 2) {
      setFormData((prev) => ({
        ...prev,
        [keys[0]]: { ...prev[keys[0]], [keys[1]]: value },
      }));
    } else if (keys.length === 3) {
      setFormData((prev) => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: {
            ...prev[keys[0]][keys[1]],
            [keys[2]]: value,
          },
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const pricePerDay = parseFloat(formData.pricing.price_per_day);

      if (isNaN(pricePerDay)) {
        setError("Please enter a valid price per day");
        return;
      }

      if (pricePerDay < 0) {
        setError("Price per day must be a positive number");
        return;
      }

      const payload = {
        ...formData,
        pricing: {
          ...formData.pricing,
          price_per_day: pricePerDay,
        },
      };

      if (isEdit) {
        await vendorService.updateVendor(id, payload);
        alert("Vendor updated successfully!");
      } else {
        await vendorService.createVendor(payload);
        alert("Vendor created successfully!");
      }
      navigate("/admin/vendors");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save vendor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
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
          <div className="absolute -top-28 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,179,107,0.28),_transparent_65%)]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
        </div>

        <div className="animate-rise mb-7 rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-[var(--soft)]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Vendor Management
              </p>
              <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                {isEdit ? "Edit Vendor" : "Add New Vendor"}
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Fill in the details below to {isEdit ? "update" : "create"} a
                vendor profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/vendors")}
              className="admin-btn admin-btn-secondary"
            >
              Back to Vendors
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className={sectionClass}>
            <div className={sectionBodyClass}>
              <h2 className="font-heading text-2xl">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Vendor Name *
                    </span>
                  </label>
                  <input
                    type="text"
                    name="vendor_name"
                    value={formData.vendor_name}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Business Name
                    </span>
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Service Type *
                    </span>
                  </label>
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    className={selectClass}
                    required
                  >
                    <option value="" disabled>
                      Select service type
                    </option>
                    {serviceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Status *
                    </span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={selectClass}
                    required
                  >
                    <option value="" disabled>
                      Select status
                    </option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className={sectionClass}>
            <div className={sectionBodyClass}>
              <h2 className="font-heading text-2xl">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Primary Email *
                    </span>
                  </label>
                  <input
                    type="email"
                    name="contact_info.primary_email"
                    value={formData.contact_info.primary_email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Primary Phone *
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="contact_info.primary_phone"
                    value={formData.contact_info.primary_phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+91-9876543210"
                    required
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Website
                    </span>
                  </label>
                  <input
                    type="url"
                    name="contact_info.website"
                    value={formData.contact_info.website}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <div className={sectionBodyClass}>
              <h2 className="font-heading text-2xl">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      City *
                    </span>
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      State
                    </span>
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Country
                    </span>
                  </label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className={sectionClass}>
            <div className={sectionBodyClass}>
              <h2 className="font-heading text-2xl">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="mb-1.5 block">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      Price Per Day (Rs.) *
                    </span>
                  </label>
                  <input
                    type="number"
                    name="pricing.price_per_day"
                    value={formData.pricing.price_per_day}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter price per day"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="sticky bottom-4 z-10 flex justify-end gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/95 p-4 shadow-[0_18px_45px_rgba(5,22,28,0.14)] backdrop-blur">
            <button
              type="button"
              onClick={() => navigate("/admin/vendors")}
              className="admin-btn admin-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Saving...
                </>
              ) : (
                <>{isEdit ? "Update Vendor" : "Create Vendor"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default VendorFormPage;
