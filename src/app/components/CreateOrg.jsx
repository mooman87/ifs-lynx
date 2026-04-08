"use client";
import { useState, useEffect } from "react";

const inputClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const CreateOrg = () => {
  const [formData, setFormData] = useState({
    name: "",
    orgType: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => setSuccessMessage(""), 3000);
    }
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const res = await fetch("/api/create_org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      setFormData({
        name: "",
        orgType: "",
      });
      setSuccessMessage("Organization created successfully! 🎉");
    } else {
      setError(data.message || "Something went wrong");
    }
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <div className="mb-2 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
          Organizations
        </div>
        <h2 className="text-xl font-bold text-gray-900">Create organization</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add a new campaign, vendor, PAC, party, or demo workspace.
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Enter organization name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Organization type
          </label>
          <select
            name="orgType"
            value={formData.orgType}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">Select org type</option>
            <option value="Vendor">Vendor</option>
            <option value="Campaign">Campaign</option>
            <option value="PAC">PAC</option>
            <option value="Party">Party</option>
            <option value="Demo">Demo</option>
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
        >
          Create organization
        </button>
      </form>
    </section>
  );
};

export default CreateOrg;
