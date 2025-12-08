// app/components/CreateOrg.jsx
"use client";
import { useState, useEffect } from "react";

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
    <div className="widget">
      <span className="font-bold text-2xl">Create New Organization</span>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {successMessage && (
        <p className="text-green-500 mt-2 transition-opacity duration-300">
          {successMessage}
        </p>
      )}

      <div className="content mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-700">Organization Type</label>
            <select
              name="orgType"
              value={formData.orgType}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
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
            className="w-full lynx-bg text-white font-bold py-2 px-4 rounded-lg"
          >
            Create Organization
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrg;
