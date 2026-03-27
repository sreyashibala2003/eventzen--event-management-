import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname ?? "/dashboard";

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,179,107,.35),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(23,73,89,.26),transparent_40%)]" />
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-8 shadow-xl"
        >
          <h1 className="font-heading text-4xl">Welcome Back</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to your EventZen account.
          </p>

          <label className="mt-6 block text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand-deep)]"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            required
          />

          <label className="mt-4 block text-sm font-medium">Password</label>
          <input
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand-deep)]"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            required
          />

          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

          <button
            className="mt-6 w-full rounded-xl bg-[var(--ink)] px-4 py-3 font-semibold text-[var(--paper)] transition hover:opacity-90 disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="mt-4 text-sm text-[var(--muted)]">
            New here?{" "}
            <Link
              className="font-medium text-[var(--brand-deep)]"
              to="/register"
            >
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
