import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <Navbar />

      {/* Hero Section */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,179,107,.25),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(23,73,89,.16),transparent_40%)]" />

        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h1 className="font-heading text-5xl font-bold text-[var(--ink)] sm:text-6xl">
            Welcome to EventZen
          </h1>
          <p className="mt-6 text-xl text-[var(--muted)] sm:text-2xl">
            The ultimate platform for managing and attending events.
          </p>
          <p className="mt-4 text-lg text-[var(--muted)]">
            Create, manage, and participate in events seamlessly with our
            intuitive event management solution.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link
              to="/register"
              className="rounded-xl bg-[var(--ink)] px-8 py-4 text-lg font-semibold text-[var(--paper)] transition hover:opacity-90"
            >
              Get Started - Create Account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-8 py-4 text-lg font-semibold text-[var(--ink)] transition hover:bg-[var(--surface)]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[var(--paper)] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-heading text-3xl font-bold text-[var(--ink)] sm:text-4xl">
            Why Choose EventZen?
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-[var(--brand-deep)] flex items-center justify-center">
                <span className="text-2xl text-white">📅</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--ink)]">
                Easy Event Creation
              </h3>
              <p className="mt-2 text-[var(--muted)]">
                Create and customize events in minutes with our intuitive
                interface
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-[var(--brand-deep)] flex items-center justify-center">
                <span className="text-2xl text-white">👥</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--ink)]">
                Ticket Booking
              </h3>
              <p className="mt-2 text-[var(--muted)]">
                Enable seamless ticket booking and manage reservations with ease
              </p>
            </div>

            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="mx-auto h-16 w-16 rounded-full bg-[var(--brand-deep)] flex items-center justify-center">
                <span className="text-2xl text-white">📊</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--ink)]">
                Real-time Analytics
              </h3>
              <p className="mt-2 text-[var(--muted)]">
                Get insights into your events with detailed analytics and
                reporting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[var(--surface)] py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-heading text-3xl font-bold text-[var(--ink)]">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-[var(--muted)]">
            Join thousands of event organizers who trust EventZen
          </p>
          <Link
            to="/register"
            className="mt-6 inline-block rounded-xl bg-[var(--ink)] px-8 py-4 text-lg font-semibold text-[var(--paper)] transition hover:opacity-90"
          >
            Create Your Free Account
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default HomePage;
