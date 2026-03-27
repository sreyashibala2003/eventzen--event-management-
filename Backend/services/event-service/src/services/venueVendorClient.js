import axios from 'axios';
import config from '../config/index.js';

const venueVendorClient = axios.create({
  baseURL: config.services.venueVendor,
  timeout: 10000
});

const buildAuthHeaders = (req) => {
  const headers = {};
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  if (req.headers['x-api-key']) {
    headers['x-api-key'] = req.headers['x-api-key'];
  }
  return headers;
};

export const fetchVenueById = async (venueId, req) => {
  const response = await venueVendorClient.get(`/venues/${venueId}`, {
    headers: buildAuthHeaders(req)
  });
  return response.data?.data?.venue;
};

export const fetchVendorById = async (vendorId, req) => {
  const response = await venueVendorClient.get(`/vendors/${vendorId}`, {
    headers: buildAuthHeaders(req)
  });
  return response.data?.data?.vendor;
};

export default {
  fetchVenueById,
  fetchVendorById
};
