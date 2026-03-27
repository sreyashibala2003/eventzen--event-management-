import axios from "axios";
import { attachAuthInterceptors } from "./authSession";

const VENUE_VENDOR_SERVICE_URL =
  import.meta.env.VITE_VENUE_VENDOR_SERVICE_URL ?? "http://localhost:3001/api/v1";

export const venueVendorClient = axios.create({
  baseURL: VENUE_VENDOR_SERVICE_URL,
  withCredentials: true,
});

attachAuthInterceptors(venueVendorClient);

export const venueService = {
  async getVenues(params = {}) {
    const response = await venueVendorClient.get("/venues", { params });
    return response.data;
  },

  async getVenueById(venueId) {
    const response = await venueVendorClient.get(`/venues/${venueId}`);
    return response.data;
  },

  async createVenue(venueData) {
    const response = await venueVendorClient.post("/venues", venueData);
    return response.data;
  },

  async updateVenue(venueId, venueData) {
    const response = await venueVendorClient.put(`/venues/${venueId}`, venueData);
    return response.data;
  },

  async deleteVenue(venueId) {
    const response = await venueVendorClient.delete(`/venues/${venueId}`);
    return response.data;
  },
};

export const vendorService = {
  async getVendors(params = {}) {
    const response = await venueVendorClient.get("/vendors", { params });
    return response.data;
  },

  async getVendorById(vendorId) {
    const response = await venueVendorClient.get(`/vendors/${vendorId}`);
    return response.data;
  },

  async createVendor(vendorData) {
    const response = await venueVendorClient.post("/vendors", vendorData);
    return response.data;
  },

  async updateVendor(vendorId, vendorData) {
    const response = await venueVendorClient.put(`/vendors/${vendorId}`, vendorData);
    return response.data;
  },

  async deleteVendor(vendorId) {
    const response = await venueVendorClient.delete(`/vendors/${vendorId}`);
    return response.data;
  },
};

export default {
  venueService,
  vendorService,
};
