import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function UserSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const displayName =
    user?.firstName || user?.name || user?.email?.split("@")?.[0] || "User";

  const initialA = displayName?.charAt(0)?.toUpperCase() || "U";
  const initialB = user?.lastName?.charAt(0)?.toUpperCase() || "";

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M4 10.5L12 4l8 6.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M6.5 9.5V19a1 1 0 001 1h3.75v-5.25A.75.75 0 0112 14h0a.75.75 0 01.75.75V20h3.75a1 1 0 001-1V9.5"
          />
        </svg>
      ),
    },
    {
      path: "/profile",
      label: "My Profile",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M5.121 17.804A9.971 9.971 0 0112 15c2.38 0 4.565.833 6.279 2.224"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M15 9a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      path: "/user/venues",
      label: "Explore Venues",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M4.75 19.25h14.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M6.75 19.25V8.75A1.75 1.75 0 018.5 7h7a1.75 1.75 0 011.75 1.75v10.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M9 10.25h1.5M13.5 10.25H15M9 13.25h1.5M13.5 13.25H15"
          />
        </svg>
      ),
    },
    {
      path: "/user/vendors",
      label: "Explore Vendors",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M7.5 11a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5zM16.5 12.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M3.75 18.25a3.75 3.75 0 017.5 0M12.75 18.25a3.25 3.25 0 016.5 0"
          />
        </svg>
      ),
    },
    {
      path: "/events/create",
      label: "Create Event",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M12 5v14"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M5 12h14"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M7.5 5.75h9a1.75 1.75 0 011.75 1.75v9A1.75 1.75 0 0116.5 18.25h-9A1.75 1.75 0 015.75 16.5v-9A1.75 1.75 0 017.5 5.75z"
          />
        </svg>
      ),
    },
    {
      path: "/events/discover",
      label: "Discover Events",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="3.25" strokeWidth="1.9" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M11 3.75c3.65 0 6.74 2.41 7.76 5.73A8.24 8.24 0 0119 11c0 .53-.05 1.05-.15 1.55"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M11 18.25A7.25 7.25 0 013.75 11 7.25 7.25 0 0111 3.75"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M16.2 16.2L20.25 20.25"
          />
        </svg>
      ),
    },
    {
      path: "/events/my",
      label: "My Events",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect
            x="4.75"
            y="5.5"
            width="14.5"
            height="14.5"
            rx="2.25"
            strokeWidth="1.9"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M8 3.75v3.5M16 3.75v3.5M4.75 9.25h14.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M8.5 13h3M8.5 16h6.5"
          />
        </svg>
      ),
    },
    {
      path: "/bookings/my",
      label: "My Bookings",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M5.75 8.25h12.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M7.75 4.75v3M16.25 4.75v3"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M6.75 6.75h10.5A1.75 1.75 0 0119 8.5v8.75A1.75 1.75 0 0117.25 19H6.75A1.75 1.75 0 015 17.25V8.5a1.75 1.75 0 011.75-1.75z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M9 12.25h6M9 15.25h3.5"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[var(--paper)] border-r border-[var(--line)] flex flex-col">
      <div className="p-6 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--ink)] text-[var(--paper)] font-semibold">
            EZ
          </div>
          <div>
            <p className="font-heading text-lg leading-none">EventZen</p>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              User Panel
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--line)] bg-[linear-gradient(135deg,rgba(255,179,107,0.32),rgba(255,250,243,0.94))] p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[var(--brand-deep)] text-white grid place-items-center font-semibold text-sm">
            {initialA}
            {initialB}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <span className="admin-badge mt-1">USER</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? "bg-[var(--brand-deep)] text-white font-medium shadow-sm"
                    : "text-[var(--ink)] hover:bg-[var(--soft)]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-[var(--line)]">
        <div className="space-y-2">
          <Link
            to="/events/create"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)] transition-colors w-full"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.9"
                d="M12 5v14"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.9"
                d="M5 12h14"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.9"
                d="M7.5 5.75h9a1.75 1.75 0 011.75 1.75v9A1.75 1.75 0 0116.5 18.25h-9A1.75 1.75 0 015.75 16.5v-9A1.75 1.75 0 017.5 5.75z"
              />
            </svg>
            New Event
          </Link>
          <Link
            to="/events/my"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)] transition-colors w-full"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect
                x="4.75"
                y="5.5"
                width="14.5"
                height="14.5"
                rx="2.25"
                strokeWidth="1.9"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.9"
                d="M8 3.75v3.5M16 3.75v3.5M4.75 9.25h14.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.9"
                d="M8.5 13h3M8.5 16h6.5"
              />
            </svg>
            My Events
          </Link>
          <Link
            to="/events/discover"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)] transition-colors w-full"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="3.25" strokeWidth="1.9" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.9"
                d="M11 3.75c3.65 0 6.74 2.41 7.76 5.73A8.24 8.24 0 0119 11c0 .53-.05 1.05-.15 1.55"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.9"
                d="M11 18.25A7.25 7.25 0 013.75 11 7.25 7.25 0 0111 3.75"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.9"
                d="M16.2 16.2L20.25 20.25"
              />
            </svg>
            Browse Events
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--line)]">
        <p className="text-xs text-[var(--muted)] text-center">
          EventZen User v1.0
        </p>
      </div>
    </aside>
  );
}

export default UserSidebar;
