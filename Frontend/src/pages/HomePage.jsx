import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const metrics = [
  { value: "All-in-One", label: "Planning workspace" },
  { value: "Smooth", label: "Booking experience" },
  { value: "Fast", label: "Setup for organizers" },
];

const workflow = [
  {
    step: "01",
    title: "Shape the event",
    description:
      "Start with your event vision, timeline, and guest expectations in one place.",
  },
  {
    step: "02",
    title: "Lock venues and vendors",
    description:
      "Review curated options, compare details clearly, and move forward with confidence.",
  },
  {
    step: "03",
    title: "Run everything smoothly",
    description:
      "Track bookings, manage updates, and keep the event day organized from dashboard to checkout.",
  },
];

const benefitCards = [
  {
    title: "A clearer planning flow",
    description:
      "Thoughtful layouts, organized details, and fewer moving parts to juggle manually.",
  },
  {
    title: "Professional presentation",
    description:
      "Present venues, vendors, and event details in a way that feels premium and reliable.",
  },
  {
    title: "Built for momentum",
    description:
      "Spend less time switching tools and more time making decisions that move the event forward.",
  },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8f1e8_0%,#f4ecdf_48%,#f5efe6_100%)]" />
            <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(255,168,88,0.32),_transparent_68%)]" />
            <div className="absolute right-0 top-0 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(23,73,89,0.18),_transparent_72%)]" />
            <div className="absolute bottom-12 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.6),_transparent_72%)]" />
          </div>

          <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:px-8 lg:pb-24 lg:pt-24">
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <span className="inline-flex rounded-full border border-[var(--line)] bg-white/75 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)] backdrop-blur">
                Refined Event Planning
              </span>
              <h1 className="mt-6 max-w-4xl font-heading text-5xl leading-[0.95] text-[var(--ink)] sm:text-6xl lg:text-7xl">
                Plan events with elegance, clarity, and control.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
                EventZen brings venues, vendors, bookings, and event management
                into a beautifully organized workflow that feels professional
                from the first click.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--ink)] px-7 py-4 text-base font-semibold text-[var(--paper)] shadow-[0_18px_45px_rgba(17,50,61,0.22)] transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  Start Planning
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-white/80 px-7 py-4 text-base font-semibold text-[var(--ink)] backdrop-blur transition hover:bg-white"
                >
                  Sign In
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 px-5 py-5 shadow-[0_14px_35px_rgba(17,50,61,0.08)] backdrop-blur"
                  >
                    <p className="font-heading text-3xl">{metric.value}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">
                  Why It Feels Better
                </p>
                <h2 className="mt-3 font-heading text-4xl leading-tight sm:text-5xl">
                  Professional tools without the clutter.
                </h2>
              </div>
              <p className="max-w-xl text-[var(--muted)] md:text-right">
                Every section is designed to make planning decisions easier to
                scan, compare, and act on.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {benefitCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-[1.7rem] border border-[var(--line)] bg-[var(--paper)] p-7 shadow-[0_18px_48px_rgba(8,30,38,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(8,30,38,0.12)]"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-deep)] text-white shadow-[0_14px_30px_rgba(23,73,89,0.22)]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M5 12h14M12 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-6 font-heading text-2xl">{card.title}</h3>
                  <p className="mt-3 leading-7 text-[var(--muted)]">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="bg-[var(--paper)] py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:px-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(246,236,223,0.95))] p-8 shadow-[0_24px_60px_rgba(10,29,36,0.08)] md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">
                About Us
              </p>
              <h2 className="mt-3 font-heading text-4xl leading-tight sm:text-5xl">
                Event planning deserves a calmer, more professional home.
              </h2>
              <p className="mt-5 leading-8 text-[var(--muted)]">
                EventZen was designed to make event planning feel structured,
                polished, and dependable. Instead of juggling disconnected tools
                and messy workflows, teams can work from one place that keeps
                venues, vendors, bookings, and event details aligned.
              </p>
            </div>

            <div className="grid gap-5">
              <article className="rounded-[1.6rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_18px_45px_rgba(10,29,36,0.07)]">
                <h3 className="font-heading text-2xl">Purpose-built clarity</h3>
                <p className="mt-3 leading-7 text-[var(--muted)]">
                  We focus on reducing noise so users can scan details quickly,
                  compare options cleanly, and move ahead with confidence.
                </p>
              </article>
              <article className="rounded-[1.6rem] border border-[var(--line)] bg-white/80 p-6 shadow-[0_18px_45px_rgba(10,29,36,0.07)]">
                <h3 className="font-heading text-2xl">Professional by design</h3>
                <p className="mt-3 leading-7 text-[var(--muted)]">
                  From discovery to booking, every screen is shaped to present
                  event information in a premium and trustworthy way.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[var(--paper)] py-20">
          <div className="mx-auto max-w-6xl px-6 md:px-8">
            <div className="rounded-[2rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(246,236,223,0.92)_100%)] p-8 shadow-[0_28px_70px_rgba(10,29,36,0.08)] md:p-10">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">
                  How It Works
                </p>
                <h2 className="mt-3 font-heading text-4xl leading-tight sm:text-5xl">
                  A polished flow from first idea to final booking.
                </h2>
              </div>

              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {workflow.map((item) => (
                  <article
                    key={item.step}
                    className="rounded-[1.6rem] border border-[var(--line)] bg-white/80 p-6 backdrop-blur"
                  >
                    <span className="inline-flex rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                      Step {item.step}
                    </span>
                    <h3 className="mt-5 font-heading text-2xl text-[var(--ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-7 text-[var(--muted)]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="pb-20">
          <div className="mx-auto max-w-6xl px-6 md:px-8">
            <div className="grid gap-6 rounded-[2rem] border border-[rgba(23,73,89,0.12)] bg-[linear-gradient(135deg,#143944_0%,#1b5060_55%,#235f70_100%)] p-8 text-white shadow-[0_28px_70px_rgba(10,29,36,0.2)] md:grid-cols-[1.1fr_0.9fr] md:p-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/65">
                  Contact Us
                </p>
                <h2 className="mt-3 font-heading text-4xl leading-tight sm:text-5xl">
                  Let&apos;s make your event workflow feel effortless.
                </h2>
                <p className="mt-5 max-w-2xl leading-8 text-white/78">
                  Reach out if you want to learn more about EventZen, explore
                  the platform, or understand how it can support your planning
                  experience.
                </p>
              </div>

              <div className="grid gap-4">
                <a
                  href="mailto:hello@eventzen.com"
                  className="rounded-[1.4rem] border border-white/12 bg-white/10 p-5 backdrop-blur transition hover:bg-white/14"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/62">
                    Email
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    hello@eventzen.com
                  </p>
                </a>
                <a
                  href="tel:+911800123456"
                  className="rounded-[1.4rem] border border-white/12 bg-white/10 p-5 backdrop-blur transition hover:bg-white/14"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/62">
                    Phone
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    +91 1800 123 456
                  </p>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="overflow-hidden rounded-[2.2rem] border border-[rgba(23,73,89,0.12)] bg-[linear-gradient(135deg,#143944_0%,#1b5060_55%,#235f70_100%)] p-8 text-center text-white shadow-[0_32px_80px_rgba(10,29,36,0.24)] md:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/65">
                Ready To Launch
              </p>
              <h2 className="mx-auto mt-4 max-w-3xl font-heading text-4xl leading-tight sm:text-5xl">
                Bring your next event together with a homepage experience that
                feels as premium as the event itself.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
                Start with EventZen to organize the planning journey, elevate
                how your events are presented, and keep every key decision in
                one place.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-base font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:bg-[var(--paper)]"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/venues"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-7 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/12"
                >
                  Explore Venues
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
