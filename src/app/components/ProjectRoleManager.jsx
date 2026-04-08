"use client";

import { useEffect, useMemo, useState } from "react";

const roleOptions = [
  "Viewer",
  "Field Lead",
  "Scheduler",
  "Project Manager",
  "Project Admin",
];

const inputClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

export default function ProjectRoleManager({ projectId, staff = [] }) {
  const [roles, setRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("Viewer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRoles = async () => {
    try {
      const res = await fetch(
        `/api/project/roles?projectId=${encodeURIComponent(projectId)}`,
        {
          credentials: "include",
        },
      );
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to load project roles.");
      setRoles(data.roles || []);
    } catch (err) {
      setError(err.message || "Failed to load project roles.");
    }
  };

  useEffect(() => {
    if (projectId) loadRoles();
  }, [projectId]);

  const assignedUserIds = useMemo(
    () => new Set(roles.map((r) => r.user?.id).filter(Boolean)),
    [roles],
  );

  const availableStaff = useMemo(
    () =>
      staff.filter(
        (person) => person.userId && !assignedUserIds.has(person.userId),
      ),
    [staff, assignedUserIds],
  );

  const saveRole = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/project/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectId,
          userId: selectedUserId,
          projectRole: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to save project role.");

      setMessage("Project role saved.");
      setSelectedUserId("");
      setSelectedRole("Viewer");
      await loadRoles();
    } catch (err) {
      setError(err.message || "Failed to save project role.");
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (userId) => {
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/project/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId, userId }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to remove project role.");

      setMessage("Project role removed.");
      await loadRoles();
    } catch (err) {
      setError(err.message || "Failed to remove project role.");
    }
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <div className="mb-2 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
          Project roles
        </div>
        <h2 className="text-xl font-bold text-gray-900">Project access</h2>
        <p className="mt-1 text-sm text-gray-500">
          Assign project-specific permissions without changing someone’s
          organization-wide role.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      <form
        onSubmit={saveRole}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className={inputClass}
          required
        >
          <option value="">Select staff user</option>
          {availableStaff.map((person) => (
            <option key={person.id} value={person.userId}>
              {person.fullName ||
                `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
                person.email}
            </option>
          ))}
        </select>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className={inputClass}
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6] disabled:opacity-60"
        >
          {loading ? "Saving..." : "Assign role"}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {!roles.length ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
            No project-specific role overrides yet.
          </div>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {role.user?.fullName || role.user?.email || "Unknown user"}
                </p>
                <p className="text-xs text-gray-500">
                  Org role: {role.user?.orgRole || "Unknown"} · Project role:{" "}
                  {role.projectRole}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeRole(role.user?.id)}
                className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
