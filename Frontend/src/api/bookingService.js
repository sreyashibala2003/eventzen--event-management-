import axios from "axios";
import { attachAuthInterceptors } from "./authSession";

const BOOKING_SERVICE_URL =
  import.meta.env.VITE_BOOKING_SERVICE_URL ?? "http://localhost:5050/api/v1";

export const bookingClient = axios.create({
  baseURL: BOOKING_SERVICE_URL,
  withCredentials: true,
});

attachAuthInterceptors(bookingClient);

export const bookingService = {
  async createCheckoutSession(payload) {
    const response = await bookingClient.post("/bookings/checkout-session", payload);
    return response.data;
  },

  async confirmPayment(bookingId, payload) {
    const response = await bookingClient.post(
      `/bookings/${bookingId}/confirm-payment`,
      payload,
    );
    return response.data;
  },

  async getMyBookings(params = {}) {
    const response = await bookingClient.get("/bookings/my-bookings", { params });
    return response.data;
  },

  async getAdminBookings(params = {}) {
    const response = await bookingClient.get("/bookings/admin/bookings", { params });
    return response.data;
  },

  async downloadTicket(bookingId, fallbackFileName = "eventzen-ticket.pdf") {
    const response = await bookingClient.get(`/bookings/${bookingId}/ticket`, {
      responseType: "blob",
    });

    const contentType = response.headers["content-type"] || "application/pdf";
    if (!contentType.toLowerCase().includes("application/pdf")) {
      throw new Error(
        `Ticket download returned ${contentType} instead of application/pdf.`,
      );
    }

    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const disposition = response.headers["content-disposition"] || "";
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainMatch = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const matchedName = utf8Match
      ? decodeURIComponent(utf8Match)
      : plainMatch;

    link.href = url;
    link.download = matchedName || fallbackFileName;
    document.body.appendChild(link);
    link.click();

    window.setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(url);
    }, 1000);
  },
};

export default bookingService;
