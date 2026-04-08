"use client";
import { useEffect, useMemo, useState } from "react";

const inputClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const roleOptions = [
  "Campaign Manager",
  "Deputy Campaign Manager",
  "Treasurer",
  "Finance Director",
  "Communications Director",
  "Press Secretary",
  "Digital Director",
  "Field Director",
  "Organizer",
  "Canvasser",
  "Volunteer Coordinator",
  "Data Director",
  "Operations Director",
  "Deputy State Director",
  "State Director",
  "Political Director",
  "C Suite",
  "HR",
  "Payroll",
  "Travel",
];

const CreateUser = () => {
  const [formData, setFormData] = useState({
    email: "",
    organization: "",
    username: "",
    fullName: "",
    password: "",
    role: "Canvasser",
    staffType: "employee",
  });

  const [orgs, setOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdStaff, setCreatedStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = currentUser?.role === "Super Admin";

  useEffect(() => {
    let timer;
    if (successMessage) timer = setTimeout(() => setSuccessMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();

        if (!res.ok || !data.user) {
          throw new Error(data.message || "Failed to load current user");
        }

        setCurrentUser(data.user);

        if (data.user?.organization?.id && data.user.role !== "Super Admin") {
          setFormData((prev) => ({
            ...prev,
            organization: data.user.organization.id,
          }));
        }
      } catch (err) {
        setError(err.message || "Failed to load current user");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setError("");
        setLoadingOrgs(true);

        const res = await fetch("/api/org", { credentials: "include" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load organizations");
        }

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.organizations)
            ? data.organizations
            : [];

        setOrgs(list);
      } catch (err) {
        setError(err.message || "Failed to load organizations");
        setOrgs([]);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrgs();
  }, []);

  const selectedOrg = useMemo(() => {
    return orgs.find((org) => org.id === formData.organization) || null;
  }, [orgs, formData.organization]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData((prev) => ({
      email: "",
      organization:
        !isSuperAdmin && currentUser?.organization?.id
          ? currentUser.organization.id
          : "",
      username: "",
      fullName: "",
      password: "",
      role: "Canvasser",
      staffType: "employee",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setCreatedStaff(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setCreatedStaff(data);
      resetForm();
      setSuccessMessage("Staff user created successfully.");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const orgFieldDisabled =
    loadingUser ||
    loadingOrgs ||
    (!isSuperAdmin && !!currentUser?.organization?.id);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <div className="mb-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Staff
        </div>
        <h2 className="text-xl font-bold text-gray-900">Add staff user</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a login-enabled staff account for your organization. Staff
          users consume seats on the current plan.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 transition-opacity duration-300">
          {successMessage}
        </div>
      )}

      {createdStaff?.organization && (
        <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Organization:</span>{" "}
            {createdStaff.organization.name}
          </p>
          <p>
            <span className="font-semibold">Role:</span>{" "}
            {createdStaff.user?.role}
          </p>
          <p>
            <span className="font-semibold">Username:</span>{" "}
            {createdStaff.user?.username}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="name@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Organization
          </label>
          <select
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            required
            disabled={orgFieldDisabled}
            className={`${inputClass} ${orgFieldDisabled ? "bg-gray-50 text-gray-500" : ""}`}
          >
            <option value="">
              {loadingUser || loadingOrgs
                ? "Loading organization..."
                : "Select organization"}
            </option>

            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} {org.slug ? `(${org.slug})` : ""}
              </option>
            ))}
          </select>

          {!loadingOrgs &&
            !loadingUser &&
            !isSuperAdmin &&
            currentUser?.organization && (
              <p className="text-xs text-gray-500">
                You can add staff users only to your own organization.
              </p>
            )}

          {selectedOrg?.seat_limit ? (
            <p className="text-xs text-gray-500">
              Seat limit: {selectedOrg.seat_limit}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Enter username"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Full name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Enter full name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Create password"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={inputClass}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 xl:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Staff type
          </label>
          <select
            name="staffType"
            value={formData.staffType}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="employee">Employee</option>
            <option value="volunteer">Volunteer</option>
            <option value="contractor">Contractor</option>
          </select>
          <p className="text-xs text-gray-500">
            This creates a login-enabled staff member and linked staff profile.
          </p>
        </div>

        <div className="xl:col-span-2 pt-1">
          <button
            type="submit"
            disabled={submitting || loadingUser}
            className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating staff user..." : "Create staff user"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default CreateUser;
