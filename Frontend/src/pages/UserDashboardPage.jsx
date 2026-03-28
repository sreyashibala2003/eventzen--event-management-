import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import { useAuth } from "../auth/AuthContext";
import UserLayout from "../components/UserLayout";

const featuredEvents = [
  {
    title: "Explore available venues",
    type: "Venue",
    details: "Browse and choose the perfect location for your event.",
    cta: "Explore Venues",
    path: "/user/venues",
  },
  {
    title: "Find trusted vendors",
    type: "Vendor",
    details:
      "Discover catering, decor, and other services for your event needs.",
    cta: "Explore Vendors",
    path: "/user/vendors",
  },
  {
    title: "Create your event",
    type: "Event",
    details:
      "Set up details, plan your schedule, and bring your event to life.",
    cta: "Create Event",
    path: "/events/create",
  },
];

const timeline = [
  {
    stamp: "Venue Planning",
    label: "Book your venue early to secure the best options",
  },
  {
    stamp: "Vendor Finalization",
    label: "Finalize vendors well before the event date",
  },
  {
    stamp: "Guest Communication",
    label: "Share event details with guests ahead of time",
  },
  { stamp: "Venue Discovery", label: "Find top-rated venues near you" },
];

function UserDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const displayName =
    user?.firstName || user?.name || user?.email?.split("@")?.[0] || "there";

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookingService.getMyBookings({ limit: 4 });
        setBookings(response?.data?.bookings || []);
      } catch (error) {
        console.error("Unable to load bookings", error);
      }
    };

    fetchBookings();
  }, []);

  return (
    <UserLayout title="User Dashboard">
      <div className="relative overflow-hidden bg-[var(--surface)] text-[var(--ink)]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-36 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,123,67,0.24),_transparent_65%)]" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.2),_transparent_70%)]" />
        </div>

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-14 pt-2 md:px-10">
          <section className="animate-rise rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_24px_60px_rgba(5,22,28,0.08)] md:p-12">
            <p className="mb-3 inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">
              Event Dashboard
            </p>
            <h1 className="max-w-3xl font-heading text-4xl leading-tight md:text-6xl">
              Hello, {displayName}. Let's plan something great.
            </h1>
            <p className="mt-5 max-w-2xl text-[var(--muted)] md:text-lg">
              Plan events, manage vendors, track guests, and execute seamlessly,
              all in one place.
            </p>
          </section>

          <section className="animate-rise-delayed">
            <h2 className="mb-4 font-heading text-2xl">User Services</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-br from-blue-50 to-blue-100 p-6 md:p-8">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-2xl text-blue-900">
                      Venue Explorer
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Browse venues and find the right place for your event
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-500 p-3 text-white">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button
                    onClick={() => navigate("/user/venues")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    Explore Venues
                  </button>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-br from-purple-50 to-purple-100 p-6 md:p-8">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-2xl text-purple-900">
                      Vendor Explorer
                    </h3>
                    <p className="mt-1 text-sm text-purple-700">
                      Discover trusted vendors for every event need
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-500 p-3 text-white">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button
                    onClick={() => navigate("/user/vendors")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    Explore Vendors
                  </button>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-br from-amber-50 to-orange-100 p-6 md:p-8">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-2xl text-amber-950">
                      Event Discovery
                    </h3>
                    <p className="mt-1 text-sm text-amber-800">
                      Browse available events and book your next experience
                    </p>
                  </div>
                  <div className="rounded-full bg-amber-500 p-3 text-white">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button
                    onClick={() => navigate("/events/discover")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-medium text-white transition-colors hover:bg-amber-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    Discover Events
                  </button>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-br from-emerald-50 to-teal-100 p-6 md:p-8">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-2xl text-teal-950">
                      My Events
                    </h3>
                    <p className="mt-1 text-sm text-teal-800">
                      Review the events you booked and manage your tickets
                    </p>
                  </div>
                  <div className="rounded-full bg-teal-500 p-3 text-white">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 14l2 2 4-4m5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button
                    onClick={() => navigate("/events/my")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    My Events
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="animate-rise-delayed rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-6 md:p-8">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="font-heading text-2xl">Services We Provide</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Build your event, your own way
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {featuredEvents.map((event) => (
                  <article
                    key={event.title}
                    className="group rounded-2xl border border-[var(--line)] bg-[var(--soft)]/40 p-5 transition hover:-translate-y-0.5 hover:bg-[var(--soft)]"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold tracking-wide text-[var(--brand-deep)]">
                        {event.type}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {event.details}
                    </p>
                    <button
                      onClick={() => navigate(event.path)}
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--brand-deep)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                    >
                      {event.cta}
                    </button>
                  </article>
                ))}
              </div>
            </div>

            <aside className="animate-rise-delayed-2 rounded-[1.6rem] border border-[var(--line)] bg-[var(--ink)] p-6 text-[var(--paper)] md:p-8">
              <h2 className="font-heading text-2xl">Plan Better Events</h2>
              <p className="mt-2 text-sm text-white/70">
                Plan and run your event with clarity and control.
              </p>
              <ul className="mt-5 space-y-3">
                {timeline.map((entry) => (
                  <li
                    key={entry.stamp}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-3"
                  >
                    <p className="font-heading text-lg">{entry.stamp}</p>
                    <p className="text-sm text-white/80">{entry.label}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </section>

        </main>
      </div>
    </UserLayout>
  );
}

export default UserDashboardPage;
