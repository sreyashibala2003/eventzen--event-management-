import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import Footer from "../components/Footer";
import { eventService } from "../api/eventService";
import { isBookableEventType } from "../utils/bookableEventTypes";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

const formatTime = (timeValue) => {
  const [hours, minutes] = String(timeValue || "00:00").split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const resolveAmount = (eventItem) => {
  const ticketPrice = Number(eventItem?.ticket_price);

  if (Number.isFinite(ticketPrice) && ticketPrice >= 0) return ticketPrice;
  return 0;
};

function PaymentWindowPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [eventItem, setEventItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");
  const [processing, setProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError("Missing event id.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await eventService.getEventById(eventId);
        const fetchedEvent = response?.data?.event || null;

        if (fetchedEvent && !isBookableEventType(fetchedEvent.event_type)) {
          setEventItem(null);
          setError("Ticket booking is not available for this event type.");
          return;
        }

        setEventItem(fetchedEvent);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load event details for payment.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const payableAmount = useMemo(() => resolveAmount(eventItem), [eventItem]);

  const handleConfirmPayment = async () => {
    if (!eventItem || processing) return;

    try {
      setProcessing(true);
      setError("");

      const checkoutResponse = await bookingService.createCheckoutSession({
        eventId: eventItem.event_id,
        amount: payableAmount,
        currency: "INR",
      });
      const bookingId = checkoutResponse?.data?.booking?.bookingId;

      if (!bookingId) {
        throw new Error("Booking id was not returned by booking-service");
      }

      const paymentResponse = await bookingService.confirmPayment(bookingId, {
        paymentMethod,
      });
      const booking = paymentResponse?.data?.booking;

      if (!booking) {
        throw new Error("Confirmed booking details were not returned");
      }

      setBookingResult(booking);

      if (window.opener) {
        window.opener.postMessage(
          {
            type: "EVENTZEN_BOOKING_CONFIRMED",
            booking,
          },
          window.location.origin,
        );
      }
    } catch (paymentError) {
      console.error(paymentError);
      setError(
        paymentError?.response?.data?.message ||
          "Payment could not be completed. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!bookingResult?.bookingId) return;

    try {
      await bookingService.downloadTicket(
        bookingResult.bookingId,
        `ticket-${bookingResult.bookingReference}.pdf`,
      );
    } catch (downloadError) {
      console.error(downloadError);
      setError("Ticket download failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6efe7] p-6 text-[#17333c]">
        <div className="rounded-[1.8rem] border border-[#decfc2] bg-white px-8 py-10 shadow-[0_22px_60px_rgba(12,26,31,0.12)]">
          <div className="loading loading-spinner loading-lg text-[#17333c]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8f1e8_0%,#f1e0cf_100%)] text-[#17333c]">
      <div className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-[#dfd1c4] bg-white shadow-[0_28px_80px_rgba(12,26,31,0.16)]">
          <div className="bg-[linear-gradient(135deg,#143845_0%,#1f5668_48%,#f0bf88_100%)] px-6 py-7 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
              Dummy Payment Window
            </p>
            <h1 className="mt-2 font-heading text-3xl">EventZen Checkout</h1>
            <p className="mt-2 text-sm text-white/80">
              Complete a demo payment with Razorpay or Cash and download your
              ticket.
            </p>
          </div>

          <div className="space-y-5 px-6 py-6">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {eventItem ? (
              <section className="rounded-[1.4rem] border border-[#eadfd4] bg-[#fffaf4] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5d7279]">
                      Event
                    </p>
                    <h2 className="mt-2 font-heading text-2xl">
                      {eventItem.event_name}
                    </h2>
                    <p className="mt-2 text-sm text-[#5d7279]">
                      {formatDate(eventItem.event_date)} -{" "}
                      {formatTime(eventItem.start_time)} to{" "}
                      {formatTime(eventItem.end_time)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#17333c] px-4 py-3 text-right text-white">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/70">
                      Payable
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatCurrency(payableAmount)}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {bookingResult ? (
              <section className="space-y-4 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Payment Confirmed
                  </p>
                  <h2 className="mt-2 font-heading text-2xl text-emerald-900">
                    Ticket ready for download
                  </h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-emerald-700">
                      Booking Ref
                    </div>
                    <div className="mt-1 font-semibold text-emerald-950">
                      {bookingResult.bookingReference}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-emerald-700">
                      Ticket Code
                    </div>
                    <div className="mt-1 font-semibold text-emerald-950">
                      {bookingResult.ticket?.ticketCode}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadTicket}
                    className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Download Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => window.close()}
                    className="rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-900"
                  >
                    Close Window
                  </button>
                </div>
              </section>
            ) : (
              <>
                <section className="rounded-[1.4rem] border border-[#eadfd4] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5d7279]">
                    Select Demo Payment Method
                  </p>
                  <div className="mt-4 grid gap-3">
                    {[
                      {
                        id: "RAZORPAY",
                        title: "Dummy Razorpay",
                        note: "Simulates an online card / UPI style payment success.",
                      },
                      {
                        id: "CASH",
                        title: "Cash Counter",
                        note: "Simulates a cash payment confirmation at the venue.",
                      },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`rounded-[1.2rem] border px-4 py-4 text-left transition ${
                          paymentMethod === method.id
                            ? "border-[#17333c] bg-[#17333c] text-white"
                            : "border-[#eadfd4] bg-[#fffaf4] text-[#17333c]"
                        }`}
                      >
                        <div className="text-sm font-semibold">
                          {method.title}
                        </div>
                        <div
                          className={`mt-1 text-sm ${
                            paymentMethod === method.id
                              ? "text-white/75"
                              : "text-[#5d7279]"
                          }`}
                        >
                          {method.note}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.4rem] border border-[#eadfd4] bg-[#fffaf4] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5d7279]">
                        Payment Summary
                      </p>
                      <p className="mt-1 text-sm text-[#5d7279]">
                        Demo key: `rzp_test_eventzen_dummy`
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.16em] text-[#5d7279]">
                        Total
                      </div>
                      <div className="mt-1 text-2xl font-semibold">
                        {formatCurrency(payableAmount)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={!eventItem || processing}
                    className="mt-5 w-full rounded-[1rem] bg-[#17333c] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processing
                      ? "Confirming payment..."
                      : `Pay with ${paymentMethod === "RAZORPAY" ? "Dummy Razorpay" : "Cash"}`}
                  </button>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer className="bg-white/70" />
    </div>
  );
}

export default PaymentWindowPage;
