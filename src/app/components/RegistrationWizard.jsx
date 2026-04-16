"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

const inputClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const planCards = [
  {
    name: "Citizen",
    price: "$0.00/mo",
    seats: 10,
    copy: "Start organizing with grassroots essentials.",
  },
  // {
  //   name: "Coalition",
  //   price: "$99.99/mo",
  //   seats: 15,
  //   copy: "For growing teams that need more horsepower.",
  // },
  // {
  //   name: "Command Center",
  //   price: "$199.99/mo",
  //   seats: 50,
  //   copy: "Full-command setup for serious operations.",
  // },
];

function PaymentStep({
  registrationToken,
  billingMode,
  onBack,
  onComplete,
  setGlobalError,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalError("");

    try {
      if (!stripe || !elements) {
        throw new Error("Payment form is still loading.");
      }

      if (!registrationToken) {
        throw new Error("Missing registration token.");
      }

      let submitError = null;

      if (billingMode === "setup") {
        const result = await stripe.confirmSetup({
          elements,
          redirect: "if_required",
        });
        submitError = result.error;
      } else {
        const result = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });
        submitError = result.error;
      }

      if (submitError) {
        throw new Error(submitError.message || "Payment confirmation failed.");
      }

      const completeRes = await fetch("/api/billing/registration/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationToken,
        }),
      });

      const completeData = await completeRes.json();

      if (!completeRes.ok) {
        throw new Error(
          completeData.message || "Unable to complete registration.",
        );
      }

      onComplete(completeData);
    } catch (error) {
      setGlobalError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-5">
        <PaymentElement />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={!stripe || !elements || loading}
          className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-5 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6] disabled:opacity-60"
        >
          {loading ? "Finishing registration..." : "Create organization"}
        </button>
      </div>
    </form>
  );
}

export default function RegistrationWizard() {
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [completeState, setCompleteState] = useState(null);
  const [registrationToken, setRegistrationToken] = useState("");
  const [billingMode, setBillingMode] = useState("subscription");

  const [formData, setFormData] = useState({
    plan: "Citizen",
    organizationName: "",
    orgType: "Campaign",
    fullName: "",
    email: "",
    username: "",
    password: "",
    role: "C Suite",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const appearance = useMemo(
    () => ({
      theme: "stripe",
      variables: {
        colorPrimary: "#534AB7",
        colorBackground: "#FFFFFF",
        colorText: "#111827",
        colorDanger: "#DC2626",
        colorTextPlaceholder: "#9CA3AF",
        borderRadius: "16px",
      },
    }),
    [],
  );

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const preparePaymentStep = async () => {
    setError("");

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      const res = await fetch("/api/billing/registration/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to prepare registration.");
      }

      setClientSecret(data.clientSecret);
      setRegistrationToken(data.registrationToken);
      setBillingMode(data.billingMode || "subscription");
      setStep(4);
    } catch (err) {
      setError(err.message || "Unable to prepare payment.");
    }
  };

  if (completeState) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-2 inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
          Workspace created
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Lynx</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your account, organization, and billing setup are all live.
        </p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Organization:</span>{" "}
            {completeState.organization.name}
          </p>
          <p>
            <span className="font-semibold">Plan:</span> {completeState.plan}
          </p>
          <p>
            <span className="font-semibold">Seat limit:</span>{" "}
            {completeState.seatLimit}
          </p>
          <p>
            <span className="font-semibold">Username:</span>{" "}
            {completeState.user.username}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <div className="mb-2 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
          Lynx registration
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Create your organization
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Pick a tier, set up your workspace, create your owner account, and
          finish billing without leaving Lynx.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {step === 1 && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {planCards.map((plan) => (
              <button
                key={plan.name}
                type="button"
                onClick={() => updateField("plan", plan.name)}
                className={`rounded-3xl border p-5 text-left transition ${
                  formData.plan === plan.name
                    ? "border-[#AFA9EC] bg-[#EEEDFE]"
                    : "border-gray-200 bg-white hover:border-[#CECBF6]"
                }`}
              >
                <div className="mb-2 text-lg font-bold text-gray-900">
                  {plan.name}
                </div>
                <div className="text-2xl font-bold text-[#3C3489]">
                  {plan.price}
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.copy}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                  {plan.seats} seats included
                </p>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-5 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Organization name
              </label>
              <input
                className={inputClass}
                value={formData.organizationName}
                onChange={(e) =>
                  updateField("organizationName", e.target.value)
                }
                placeholder="Friends of Main Street"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Organization type
              </label>
              <select
                className={inputClass}
                value={formData.orgType}
                onChange={(e) => updateField("orgType", e.target.value)}
              >
                <option value="Campaign">Campaign</option>
                <option value="Vendor">Vendor</option>
                <option value="PAC">PAC</option>
                <option value="Party">Party</option>
                <option value="Demo">Demo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-5 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Full name
              </label>
              <input
                className={inputClass}
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Email
              </label>
              <input
                type="email"
                className={inputClass}
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Username
              </label>
              <input
                className={inputClass}
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Password
              </label>
              <input
                type="password"
                className={inputClass}
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => updateField("acceptTerms", e.target.checked)}
                className="mt-1"
              />
              <span>I agree to the Terms of Service.</span>
            </label>

            <label className="mt-3 flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.acceptPrivacy}
                onChange={(e) => updateField("acceptPrivacy", e.target.checked)}
                className="mt-1"
              />
              <span>I agree to the Privacy Policy.</span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>

            <button
              type="button"
              onClick={preparePaymentStep}
              className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-5 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
            >
              Continue to payment
            </button>
          </div>
        </div>
      )}

      {step === 4 && clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance,
          }}
        >
          <PaymentStep
            registrationToken={registrationToken}
            billingMode={billingMode}
            onBack={() => setStep(3)}
            onComplete={setCompleteState}
            setGlobalError={setError}
          />
        </Elements>
      )}
    </section>
  );
}
