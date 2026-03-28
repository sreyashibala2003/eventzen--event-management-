import { useEffect, useMemo, useState } from "react";
import { httpClient } from "../api/httpClient";
import { useAuth } from "../auth/AuthContext";
import AdminLayout from "../components/AdminLayout";
import UserLayout from "../components/UserLayout";

const phonePattern = /^$|^[+0-9\-()\s]{7,30}$/;

function readApiError(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

function MyProfilePage() {
  const { user, isAdmin, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    });
  }, [user?.firstName, user?.lastName, user?.phone]);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email?.split("@")?.[0] ||
    "User";

  const initials = useMemo(() => {
    const firstInitial = (user?.firstName || displayName)?.charAt(0) || "U";
    const lastInitial = user?.lastName?.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [displayName, user?.firstName, user?.lastName]);

  const normalizedRole =
    user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null) || "USER";

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const payload = {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      phone: profileForm.phone.trim(),
    };

    if (!payload.firstName) {
      setProfileError("First name is required.");
      return;
    }

    if (!payload.lastName) {
      setProfileError("Last name is required.");
      return;
    }

    if (!phonePattern.test(payload.phone)) {
      setProfileError(
        "Phone number must be 7-30 characters using digits and + - ( ).",
      );
      return;
    }

    try {
      setSavingProfile(true);
      await httpClient.put("/auth/me", payload);
      await refreshUser();
      setProfileSuccess("Profile updated successfully.");
    } catch (error) {
      setProfileError(readApiError(error, "Failed to update profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const currentPassword = passwordForm.currentPassword;
    const newPassword = passwordForm.newPassword;
    const confirmPassword = passwordForm.confirmPassword;

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password must match.");
      return;
    }

    try {
      setSavingPassword(true);
      await httpClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess("Password changed successfully.");
    } catch (error) {
      setPasswordError(readApiError(error, "Failed to change password."));
    } finally {
      setSavingPassword(false);
    }
  };

  const profileContent = (
    <div className="relative overflow-hidden bg-[var(--surface)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-36 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,123,67,0.2),_transparent_65%)]" />
      </div>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pb-14 pt-8 md:px-10">
        <section className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_18px_40px_rgba(17,50,61,0.06)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--brand-deep)] text-xl font-semibold text-white">
              {initials}
            </div>
            <div>
              <h2 className="font-heading text-2xl">{displayName}</h2>
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
                {normalizedRole}
              </p>
            </div>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--ink)]">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  First Name
                </span>
                <input
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 outline-none focus:border-[var(--brand-deep)]"
                  maxLength={80}
                />
              </label>
              <label className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--ink)]">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Last Name
                </span>
                <input
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 outline-none focus:border-[var(--brand-deep)]"
                  maxLength={80}
                />
              </label>
              <label className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--ink)] md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Phone Number
                </span>
                <input
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 outline-none focus:border-[var(--brand-deep)]"
                  maxLength={30}
                  placeholder="+1 555 123 4567"
                />
              </label>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Email
                </p>
                <p className="mt-2 font-medium break-all">
                  {user?.email || "-"}
                </p>
              </div>
            </div>

            {profileError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileError}
              </p>
            ) : null}
            {profileSuccess ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {profileSuccess}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={savingProfile}
              className="admin-btn admin-btn-primary"
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-8 shadow-[0_18px_40px_rgba(17,50,61,0.06)]">
          <h2 className="font-heading text-2xl">Change Password</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Update your password to keep your account secure.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
            <label className="block text-sm text-[var(--ink)]">
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Current Password
              </span>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 outline-none focus:border-[var(--brand-deep)]"
                autoComplete="current-password"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-[var(--ink)]">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  New Password
                </span>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 outline-none focus:border-[var(--brand-deep)]"
                  autoComplete="new-password"
                />
              </label>

              <label className="text-sm text-[var(--ink)]">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Confirm Password
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 outline-none focus:border-[var(--brand-deep)]"
                  autoComplete="new-password"
                />
              </label>
            </div>

            {passwordError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </p>
            ) : null}
            {passwordSuccess ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {passwordSuccess}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={savingPassword}
              className="admin-btn admin-btn-primary"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );

  if (isAdmin) {
    return <AdminLayout>{profileContent}</AdminLayout>;
  }

  return <UserLayout title="My Profile">{profileContent}</UserLayout>;
}

export default MyProfilePage;
