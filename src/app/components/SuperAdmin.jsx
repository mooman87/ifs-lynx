//Super admin (me) is the only place CreateUser renders. Really, this whole component should change to a Super Admin only view. But I don't know what that looks like yet.
"use client";

import { useMemo, useState } from "react";
import CreateOrg from "./CreateOrg";
import CreateUser from "./CreateUser";

const adminTabs = [
  {
    id: "orgs",
    label: "Organizations",
    description: "Create and manage organizational workspaces.",
  },
  {
    id: "users",
    label: "Users",
    description: "Register accounts and assign roles.",
  },
];

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState("orgs");

  const activeMeta = useMemo(
    () => adminTabs.find((tab) => tab.id === activeTab),
    [activeTab],
  );

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="mb-2 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
            Admin dashboard
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create organizations, add users, and prepare Lynx for broader admin
            controls.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-purple-100 bg-[#faf7ff] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Workspace
            </p>
            <p className="text-lg font-bold text-purple-700">Admin Dashboard</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Current section
            </p>
            <p className="text-lg font-bold text-emerald-700">
              {activeMeta?.label}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Next phase
            </p>
            <p className="text-lg font-bold text-gray-900">
              Expanded org controls
            </p>
          </div>
        </div>
      </header>

      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {adminTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  isActive
                    ? "border-purple-600 text-purple-700"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "orgs" ? <CreateOrg /> : <CreateUser />}
    </div>
  );
}
