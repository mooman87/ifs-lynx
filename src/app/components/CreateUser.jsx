"use client";
import { useEffect, useState } from "react";

const CreateUser = () => {
  const [formData, setFormData] = useState({
    email: "",
    organization: "",
    username: "",
    fullName: "",
    password: "",
    role: "Canvasser",
  });

  const [orgs, setOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let timer;
    if (successMessage) timer = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setError("");
        setLoadingOrgs(true);

        const res = await fetch("/api/org", { credentials: "include" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to load organizations");

        const list = Array.isArray(data) ? data : Array.isArray(data.organizations) ? data.organizations : [];
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      setFormData({
        email: "",
        organization: "",
        username: "",
        fullName: "",
        password: "",
        role: "Canvasser",
      });
      setSuccessMessage("User registered successfully! 🎉");
    } else {
      setError(data.message || "Something went wrong");
    }
  };

  return (
    <div className="widget">
      <span className="font-bold text-2xl">Create User</span>

      {error && <p className="text-red-500">{error}</p>}
      {successMessage && (
        <p className="text-green-500 transition-opacity duration-300">
          {successMessage}
        </p>
      )}

      <div className="content">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-700">Organization</label>
            <select
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              required
              disabled={loadingOrgs}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            >
              <option value="">
                {loadingOrgs ? "Loading organizations..." : "Select organization"}
              </option>

              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} {org.slug ? `(${org.slug})` : ""}
                </option>
              ))}
            </select>

            {!loadingOrgs && orgs.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No organizations found. Create one first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-700">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            >
              <option value="Canvasser">Canvasser</option>
              <option value="Field Director">Field Director</option>
              <option value="Deputy State Director">Deputy State Director</option>
              <option value="State Director">State Director</option>
              <option value="Political Director">Political Director</option>
              <option value="C Suite">C Suite</option>
              <option value="HR">HR</option>
              <option value="Payroll">Payroll</option>
              <option value="Travel">Travel</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full lynx-bg text-white font-bold py-2 px-4 rounded-lg"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
