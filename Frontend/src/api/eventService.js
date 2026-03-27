import axios from "axios";
import { attachAuthInterceptors } from "./authSession";

const EVENT_SERVICE_URL =
  import.meta.env.VITE_EVENT_SERVICE_URL ?? "http://localhost:3002/api/v1";

export const eventClient = axios.create({
  baseURL: EVENT_SERVICE_URL,
  withCredentials: true,
});

attachAuthInterceptors(eventClient);

export const eventService = {
  async getEvents(params = {}) {
    const response = await eventClient.get("/events", { params });
    return response.data;
  },

  async getEventById(eventId) {
    const response = await eventClient.get(`/events/${eventId}`);
    return response.data;
  },

  async createEvent(payload) {
    const response = await eventClient.post("/events", payload);
    return response.data;
  },

  async updateEvent(eventId, payload) {
    const response = await eventClient.put(`/events/${eventId}`, payload);
    return response.data;
  },

  async updateEventStatus(eventId, payload) {
    const response = await eventClient.put(`/events/${eventId}/status`, payload);
    return response.data;
  },

  async deleteEvent(eventId) {
    const response = await eventClient.delete(`/events/${eventId}`);
    return response.data;
  },
};

export default eventService;
