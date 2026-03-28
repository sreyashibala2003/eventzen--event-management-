import { Link } from "react-router-dom";

function Footer({ className = "" }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`border-t border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur ${className}`.trim()}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-[var(--muted)] md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="font-heading text-2xl font-semibold text-[var(--ink)]">
            EventZen
          </p>
          <p className="mt-2 leading-6">
            Elegant tools for discovering venues, finding vendors, and managing
            events with confidence.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex flex-wrap gap-4 text-[var(--ink)]">
            <Link to="/" className="transition hover:text-[var(--brand-deep)]">
              Home
            </Link>
            <Link
              to="/#about"
              className="transition hover:text-[var(--brand-deep)]"
            >
              About Us
            </Link>
            <Link
              to="/#contact"
              className="transition hover:text-[var(--brand-deep)]"
            >
              Contact Us
            </Link>
            <Link
              to="/register"
              className="transition hover:text-[var(--brand-deep)]"
            >
              Get Started
            </Link>
          </div>
          <p>Copyright {year} EventZen. Crafted for seamless event planning.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
