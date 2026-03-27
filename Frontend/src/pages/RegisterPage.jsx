import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_90%,rgba(255,179,107,.36),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(23,73,89,.26),transparent_35%)]" />
        <form
          onSubmit={onSubmit}
          className="w-full max-w-xl rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-8 shadow-xl"
        >
          <h1 className="font-heading text-4xl">Create Account</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Start managing and attending events instantly.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand-deep)]"
                value={form.firstName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, firstName: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <input
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand-deep)]"
                value={form.lastName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, lastName: e.target.value }))
                }
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand-deep)]"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand-deep)]"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand-deep)]"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                minLength={8}
                required
              />
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

          <button
            className="mt-6 w-full rounded-xl bg-[var(--ink)] px-4 py-3 font-semibold text-[var(--paper)] transition hover:opacity-90 disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="mt-4 text-sm text-[var(--muted)]">
            Already registered?{" "}
            <Link className="font-medium text-[var(--brand-deep)]" to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
