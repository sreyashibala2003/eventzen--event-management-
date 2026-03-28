import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="border-b border-[var(--line)] bg-[var(--paper)]/85 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-3 text-[var(--ink)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#163b46_0%,#1f5a6a_100%)] text-sm font-semibold text-white shadow-[0_14px_30px_rgba(17,50,61,0.2)]">
              EZ
            </span>
            <span className="font-heading text-2xl font-semibold">
              EventZen
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#about"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:-translate-y-0.5 hover:bg-white"
          >
            <svg
              className="h-4 w-4 text-[var(--brand-deep)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            About Us
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:-translate-y-0.5 hover:bg-white"
          >
            <svg
              className="h-4 w-4 text-[var(--brand-deep)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M3 5h18M3 7l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Us
          </a>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#163b46_0%,#1f5a6a_100%)] px-5 py-2.5 text-sm font-semibold text-[var(--paper)] shadow-[0_14px_32px_rgba(17,50,61,0.22)] transition hover:-translate-y-0.5 hover:opacity-95"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Account
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:-translate-y-0.5 hover:bg-white"
          >
            <svg
              className="h-4 w-4 text-[var(--brand-deep)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
              />
            </svg>
            Log In
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <a
            href="#about"
            className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--ink)]"
          >
            About
          </a>
          <Link
            to="/register"
            className="inline-flex items-center rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)]"
          >
            Join
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--ink)]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
