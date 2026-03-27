import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { venueService } from "../api/venueVendorService";
import { getToken } from "../auth/tokenStore";
import AdminLayout from "../components/AdminLayout";

const VenueFormPage = () => {
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
    venue_name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postal_code: "",
    capacity: "",
    price_per_day: "",
    description: "",
    venue_type: "",
    amenities: [],
    contact_info: {
      phone: "",
      email: "",
      manager_name: "",
      website: "",
    },
    cancellation_policy: "",
    images: [],
    status: "",
  });

  const venueTypes = [
    "banquet_hall",
    "conference_center",
    "outdoor_space",
    "hotel",
    "restaurant",
    "community_center",
    "resort",
    "garden",
    "auditorium",
  ];

  const amenitiesList = [
    "parking",
    "wifi",
    "catering_kitchen",
    "sound_system",
    "projector",
    "ac",
    "handicap_accessible",
    "security",
    "valet_parking",
    "photo_booth_area",
  ];

  const cancellationPolicies = [
    { value: "flexible", label: "Flexible" },
    { value: "moderate", label: "Moderate" },
    { value: "strict", label: "Strict" },
  ];

  const fetchVenue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await venueService.getVenueById(id);
      const venue = response.data?.venue;

      if (!venue) {
        throw new Error("Venue details were not returned by the server");
      }

      setFormData({
        venue_name: venue.venue_name || "",
        address: venue.address || "",
        city: venue.city || "",
        state: venue.state || "",
        country: venue.country || "India",
        postal_code: venue.postal_code || "",
        capacity: venue.capacity || "",
        price_per_day: venue.price_per_day || "",
        description: venue.description || "",
        venue_type: venue.venue_type || "",
        amenities: venue.amenities || [],
        contact_info: venue.contact_info || {
          phone: "",
          email: "",
          manager_name: "",
          website: "",
        },
        cancellation_policy: venue.cancellation_policy || "",
        images: venue.images || [],
        status: venue.status || "",
      });
    } catch (err) {
      setError("Failed to load venue details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchVenue();
    }
  }, [isEdit, fetchVenue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("contact_")) {
      const field = name.replace("contact_", "");
      setFormData((prev) => ({
        ...prev,
        contact_info: { ...prev.contact_info, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            {
              url: event.target.result,
              caption: file.name,
              is_primary: prev.images.length === 0, // First image is primary by default
            },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const updatedImages = prev.images.filter((_, i) => i !== index);
      // If we removed the primary image and there are still images, make the first one primary
      if (updatedImages.length > 0 && prev.images[index].is_primary) {
        updatedImages[0].is_primary = true;
      }
      return { ...prev, images: updatedImages };
    });
  };

  const handleSetPrimaryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      })),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check authentication
      const token = getToken();
      if (!token) {
        throw new Error(
          "You must be logged in to create a venue. Please log in and try again.",
        );
      }

      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity),
        price_per_day: parseFloat(formData.price_per_day),
      };

      // Debug: Log the payload to see what's being sent
      console.log(
        "🚀 Payload being sent to API:",
        JSON.stringify(payload, null, 2),
      );

      // Validate required fields
      if (
        !payload.venue_name ||
        !payload.address ||
        !payload.city ||
        !payload.capacity ||
        Number.isNaN(payload.price_per_day)
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (payload.price_per_day < 0 || payload.price_per_day > 5000000) {
        throw new Error("Price per day must be between 0 and 5000000");
      }

      // Validate venue_name length (backend requirement: 3-200 characters)
      if (payload.venue_name.length < 3 || payload.venue_name.length > 200) {
        throw new Error("Venue name must be between 3 and 200 characters");
      }

      // Validate address length (backend requirement: 10-500 characters)
      if (payload.address.length < 10 || payload.address.length > 500) {
        throw new Error("Address must be between 10 and 500 characters");
      }

      // Validate city length (backend requirement: 2-100 characters)
      if (payload.city.length < 2 || payload.city.length > 100) {
        throw new Error("City must be between 2 and 100 characters");
      }

      if (!payload.contact_info.phone || !payload.contact_info.email) {
        throw new Error("Phone and Email are required in contact information");
      }

      // Validate phone format (must match backend regex: /^\+?[\d\s\-\(\)]{10,15}$/)
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(payload.contact_info.phone)) {
        throw new Error(
          "Phone number format is invalid. Use format: +91-9876543210 or +919876543210",
        );
      }

      // Validate email format (must match backend regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payload.contact_info.email)) {
        throw new Error(
          "Email format is invalid. Please provide a valid email address",
        );
      }

      if (isEdit) {
        await venueService.updateVenue(id, payload);
        alert("Venue updated successfully!");
      } else {
        await venueService.createVenue(payload);
        alert("Venue created successfully!");
      }
      navigate("/admin/venues");
    } catch (err) {
      console.error("❌ Full error object:", err);
      console.error("❌ Error response data:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      console.error("❌ Error headers:", err.response?.headers);

      let errorMessage = "Failed to save venue";

      // Handle validation errors from backend
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData.error === "VALIDATION_ERROR" && errorData.details) {
          // Format validation errors for display
          errorMessage = `Validation Error: ${errorData.message}\nDetails:\n${errorData.details.map((detail) => `• ${detail.field}: ${detail.message}`).join("\n")}`;
        } else {
          errorMessage =
            errorData.message ||
            errorData.error ||
            "Bad Request - Please check your data";
        }
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in and try again.";
      } else if (err.response?.status === 403) {
        errorMessage =
          "Access denied. You don't have permission to create venues.";
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
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
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.16),_transparent_70%)]" />
        </div>

        <div className="animate-rise mb-7 rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_24px_70px_rgba(5,22,28,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-[var(--soft)]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Venue Management
              </p>
              <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                {isEdit ? "Edit Venue" : "Add New Venue"}
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Fill in the details below to {isEdit ? "update" : "create"} a
                venue profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/venues")}
              className="admin-btn admin-btn-secondary"
            >
              Back to Venues
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
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
              <div>
                <h3 className="font-bold">Error!</h3>
                <div className="text-xs whitespace-pre-line">{error}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className={sectionClass}>
            <div className={sectionBodyClass}>
              <h2 className="font-heading text-2xl">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Venue Name *</span>
                  </label>
                  <input
                    type="text"
                    name="venue_name"
                    value={formData.venue_name}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    minLength="3"
                    maxLength="200"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Venue Type *</span>
                  </label>
                  <select
                    name="venue_type"
                    value={formData.venue_type}
                    onChange={handleChange}
                    className={selectClass}
                    required
                  >
                    <option value="" disabled>
                      Select venue type
                    </option>
                    {venueTypes.map((type) => (
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
                  <label className="label">
                    <span className="label-text">Status *</span>
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

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Capacity *</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    min="1"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Price per Day (₹) *</span>
                  </label>
                  <input
                    type="number"
                    name="price_per_day"
                    value={formData.price_per_day}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    min="0"
                    max="5000000"
                    step="0.01"
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={inputClass}
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <div className={sectionBodyClass}>
              <h2 className="font-heading text-2xl">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Address *</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    minLength="10"
                    maxLength="500"
                    placeholder="Full address"
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">
                      {formData.address.length}/500 characters
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">City *</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    minLength="2"
                    maxLength="100"
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">
                      {formData.city.length}/100 characters
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">State</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Country</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Postal Code</span>
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className={inputClass}
                  />
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
                  <label className="label">
                    <span className="label-text">Phone *</span>
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_info.phone}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    placeholder="+91-9876543210"
                    pattern="^\+?[\d\s\-\(\)]{10,15}$"
                    title="Phone format: +91-9876543210 or +919876543210"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email *</span>
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_info.email}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    placeholder="contact@venue.com"
                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                    title="Valid email format required"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Manager Name</span>
                  </label>
                  <input
                    type="text"
                    name="contact_manager_name"
                    value={formData.contact_info.manager_name}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Website</span>
                  </label>
                  <input
                    type="url"
                    name="contact_website"
                    value={formData.contact_info.website}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className={sectionClass}>
            <div className={sectionBodyClass}>
              <h2 className="font-heading text-2xl">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="cursor-pointer label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text ml-2 capitalize">
                      {amenity.replace("_", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className={sectionClass}>
            <div className={sectionBodyClass}>
              <h2 className="font-heading text-2xl">Cancellation Policy</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Cancellation Policy *</span>
                </label>
                <select
                  name="cancellation_policy"
                  value={formData.cancellation_policy}
                  onChange={handleChange}
                  className={selectClass}
                  required
                >
                  <option value="" disabled>
                    Select cancellation policy
                  </option>
                  {cancellationPolicies.map((policy) => (
                    <option key={policy.value} value={policy.value}>
                      {policy.label}
                    </option>
                  ))}
                </select>
                <label className="label">
                  <span className="label-text-alt">
                    {formData.cancellation_policy === "flexible" &&
                      "Full refund until 48 hours before event"}
                    {formData.cancellation_policy === "moderate" &&
                      "50% refund until 1 week before event"}
                    {formData.cancellation_policy === "strict" &&
                      "No refunds after booking"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className={sectionClass}>
            <div className={sectionBodyClass}>
              <h2 className="font-heading text-2xl">Venue Images</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Upload Images</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="file-input"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Upload multiple images of the venue
                  </span>
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Uploaded Images:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={image.caption}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {image.is_primary && (
                          <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs">
                            Primary
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {!image.is_primary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(index)}
                              className="admin-btn admin-btn-primary admin-btn-sm admin-btn-icon"
                              title="Set as primary image"
                            >
                              ★
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="admin-btn admin-btn-danger admin-btn-sm admin-btn-icon"
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-center truncate">
                          {image.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="sticky bottom-4 z-10 flex justify-end gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/95 p-4 shadow-[0_18px_45px_rgba(5,22,28,0.14)] backdrop-blur">
            <button
              type="button"
              onClick={() => navigate("/admin/venues")}
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
                <>{isEdit ? "Update Venue" : "Create Venue"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default VenueFormPage;
