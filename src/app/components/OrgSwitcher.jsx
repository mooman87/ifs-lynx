// app/components/OrgSwitcher.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const OrgSwitcher = () => {
  const [orgs, setOrgs] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await fetch("/api/org");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load orgs");
        setOrgs(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchOrgs();
  }, []);

  const handleChange = (e) => {
    const slug = e.target.value;
    setSelectedSlug(slug);
    if (slug) {
     router.push(`/org/${slug}`);
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-bold text-2xl">
        Switch Organization
      </label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <select
        value={selectedSlug}
        onChange={handleChange}
        className="w-full rounded-md border border-gray-300 p-2 text-sm"
      >
        <option value="">Select organization</option>
        {orgs.map((org) => (
          <option key={org.id} value={org.slug}>
            {org.name} ({org.orgType || "N/A"})
          </option>
        ))}
      </select>
    </div>
  );
};

export default OrgSwitcher;
