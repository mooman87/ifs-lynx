"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const inputClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const planCards = [
  {
    name: "Citizen",
    price: "$0.00/mo",
    seats: 5,
    description: "Grassroots essentials with card on file.",
  },
  {
    name: "Coalition",
    price: "$99.99/mo",
    seats: 15,
    description: "Growing team plan for active orgs.",
  },
  {
    name: "Command Center",
    price: "$199.99/mo",
    seats: 50,
    description: "Full control center for larger operations.",
  },
];

function formatInvoiceAmount(total, currency) {
  if (typeof total !== "number") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(total / 100);
}

function formatUnixDate(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString();
}

export default function OrganizationBillingSettings() {
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("orgSlug") || "";

  const [organization, setOrganization] = useState(null);
  const [billing, setBilling] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    orgType: "Campaign",
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [managingPlan, setManagingPlan] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const qs = useMemo(
    () => (orgSlug ? `?orgSlug=${encodeURIComponent(orgSlug)}` : ""),
    [orgSlug],
  );

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");

      const [orgRes, billingRes] = await Promise.all([
        fetch(`/api/org/current${qs}`, { credentials: "include" }),
        fetch(`/api/billing/current${qs}`, { credentials: "include" }),
      ]);

      const orgData = await orgRes.json();
      const billingData = await billingRes.json();

      if (!orgRes.ok) {
        throw new Error(
          orgData.message || "Failed to load organization settings.",
        );
      }

      if (!billingRes.ok) {
        throw new Error(billingData.message || "Failed to load billing.");
      }

      setOrganization(orgData.organization);
      setBilling(billingData.billing);
      setSettingsForm({
        name: orgData.organization?.name || "",
        orgType: orgData.organization?.orgType || "Campaign",
      });
    } catch (err) {
      setError(err.message || "Failed to load billing page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/org/current${qs}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settingsForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || "Failed to update organization settings.",
        );
      }

      setOrganization(data.organization);
      setMessage("Organization settings updated.");
    } catch (err) {
      setError(err.message || "Failed to update organization settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const manageBilling = async (action, plan = null) => {
    setManagingPlan(action + (plan || ""));
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/billing/manage${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, plan }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Billing action failed.");
      }

      setMessage(data.message || "Billing updated.");
      await loadPage();
    } catch (err) {
      setError(err.message || "Billing action failed.");
    } finally {
      setManagingPlan("");
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">
          Loading billing and organization settings...
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="mb-2 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
            Organization billing
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Billing & settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization profile, monitor seats, and control
            subscription status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-purple-100 bg-[#faf7ff] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Plan
            </p>
            <p className="text-lg font-bold text-purple-700">
              {organization?.plan || "Unconfigured"}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Status
            </p>
            <p className="text-lg font-bold text-emerald-700">
              {organization?.subscription_status || "Unknown"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Seats used
            </p>
            <p className="text-lg font-bold text-gray-900">
              {billing?.seatsUsed ?? 0} / {organization?.seat_limit ?? "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Seats remaining
            </p>
            <p className="text-lg font-bold text-amber-700">
              {billing?.seatsRemaining ?? "—"}
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            Organization settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update top-level information for this workspace.
          </p>
        </div>

        <form
          onSubmit={saveSettings}
          className="grid grid-cols-1 gap-4 xl:grid-cols-2"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Organization name
            </label>
            <input
              name="name"
              value={settingsForm.name}
              onChange={handleSettingsChange}
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Organization type
            </label>
            <select
              name="orgType"
              value={settingsForm.orgType}
              onChange={handleSettingsChange}
              className={inputClass}
            >
              <option value="Campaign">Campaign</option>
              <option value="Vendor">Vendor</option>
              <option value="PAC">PAC</option>
              <option value="Party">Party</option>
              <option value="Demo">Demo</option>
            </select>
          </div>

          <div className="xl:col-span-2 pt-1">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6] disabled:opacity-60"
            >
              {savingSettings ? "Saving..." : "Save settings"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">Subscription</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review your current billing status and manage plan actions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {planCards.map((plan) => {
            const isCurrent = organization?.plan === plan.name;
            return (
              <div
                key={plan.name}
                className={`rounded-3xl border p-5 ${
                  isCurrent
                    ? "border-[#AFA9EC] bg-[#EEEDFE]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="mb-2 text-lg font-bold text-gray-900">
                  {plan.name}
                </div>
                <div className="text-2xl font-bold text-[#3C3489]">
                  {plan.price}
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                  {plan.seats} seats
                </p>

                <div className="mt-4">
                  {isCurrent ? (
                    <span className="inline-flex rounded-full border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
                      Current plan
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!!managingPlan}
                      onClick={() => manageBilling("change_plan", plan.name)}
                      className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                    >
                      {managingPlan === `change_plan${plan.name}`
                        ? "Updating..."
                        : "Switch plan"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!!managingPlan}
            onClick={() => manageBilling("cancel")}
            className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
          >
            {managingPlan === "cancel" ? "Updating..." : "Cancel at period end"}
          </button>

          <button
            type="button"
            disabled={!!managingPlan}
            onClick={() => manageBilling("reactivate")}
            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            {managingPlan === "reactivate"
              ? "Updating..."
              : "Reactivate subscription"}
          </button>
        </div>

        {billing?.subscription ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Stripe status:</span>{" "}
              {billing.subscription.status}
            </p>
            <p>
              <span className="font-semibold">Cancel at period end:</span>{" "}
              {billing.subscription.cancel_at_period_end ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-semibold">Current period end:</span>{" "}
              {formatUnixDate(billing.subscription.current_period_end)}
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This organization is not on an active paid subscription yet. Citizen
            plan upgrades from this page are the next step.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">Payment method</h2>
          <p className="mt-1 text-sm text-gray-500">
            Read-only summary for now. Payment method update flow comes next.
          </p>
        </div>

        {billing?.paymentMethod ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Card:</span>{" "}
              {billing.paymentMethod.brand?.toUpperCase()} ending in{" "}
              {billing.paymentMethod.last4}
            </p>
            <p>
              <span className="font-semibold">Expires:</span>{" "}
              {billing.paymentMethod.exp_month}/{billing.paymentMethod.exp_year}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
            No payment method summary available.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">Recent invoices</h2>
          <p className="mt-1 text-sm text-gray-500">
            Stripe-backed invoice history for this organization.
          </p>
        </div>

        {!billing?.invoices?.length ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
            No invoices found yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billing.invoices.map((invoice, index) => (
                    <tr
                      key={invoice.id}
                      className={
                        index !== billing.invoices.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {invoice.number || invoice.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatUnixDate(invoice.created)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {invoice.status || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                        {formatInvoiceAmount(invoice.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
