import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-[var(--paper)] border-b border-[var(--line)] px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-[var(--ink)]">
            EventZen
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--surface)]"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] transition hover:opacity-90"
          >
            Create Account
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
