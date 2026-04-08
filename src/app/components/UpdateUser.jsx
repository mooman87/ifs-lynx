"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const UpdateUser = () => {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match!");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });

    const data = await response.json();
    setMessage(data.message);
    setLoading(false);
  };

  const isErrorMessage =
    message.toLowerCase().includes("not match") ||
    message.toLowerCase().includes("error") ||
    message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("failed");

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="mb-2 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
            Account security
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Update password</h1>
          <p className="mt-1 text-sm text-gray-500">
            Change credentials for an existing user account.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-purple-100 bg-[#faf7ff] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Section
            </p>
            <p className="text-lg font-bold text-purple-700">User access</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Action
            </p>
            <p className="text-lg font-bold text-gray-900">Password reset</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Scope
            </p>
            <p className="text-lg font-bold text-amber-700">
              Credential update
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">Credentials</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter the existing password and set a new one.
          </p>
        </div>

        {message ? (
          <div
            className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
              isErrorMessage
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 xl:grid-cols-2"
        >
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Re-enter new password"
              required
            />
          </div>

          <div className="xl:col-span-2 pt-1">
            <button
              type="submit"
              className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                loading
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489] hover:bg-[#CECBF6]"
              }`}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default UpdateUser;
