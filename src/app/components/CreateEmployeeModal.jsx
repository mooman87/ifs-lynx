"use client";

import React, { useMemo, useState } from "react";

const toLabel = (key = "") =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

const baseInput =
  "min-w-0 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const steps = [
  {
    id: "basic",
    title: "Basic info",
    description: "Name, gender, and date of birth.",
    fields: ["firstName", "lastName", "gender", "dob"],
  },
  {
    id: "contact",
    title: "Contact",
    description: "Phone and email details.",
    fields: ["phone", "email"],
  },
  {
    id: "address",
    title: "Address",
    description: "Street address and location details.",
    fields: ["address", "address2", "city", "state", "zip"],
  },
  {
    id: "role",
    title: "Role & reporting",
    description: "Position, manager, and start date.",
    fields: ["role", "reportsTo", "availableStart"],
  },
  {
    id: "travel",
    title: "Travel",
    description: "Airport preferences and rental eligibility.",
    fields: ["homeAirport", "altAirport", "rentalCarEligible"],
  },
];

const getFieldSpanClass = (stepId, field) => {
  if (stepId === "contact") {
    if (field === "email") return "md:col-span-2";
    return "";
  }

  if (stepId === "address") {
    if (field === "address" || field === "address2") return "md:col-span-3";
    if (field === "city" || field === "state" || field === "zip")
      return "md:col-span-2";
    return "";
  }

  return "";
};

const getGridClass = (stepId) => {
  if (stepId === "contact") {
    return "grid grid-cols-1 gap-4 md:grid-cols-2";
  }

  if (stepId === "address") {
    return "grid grid-cols-1 gap-4 md:grid-cols-6";
  }

  return "grid grid-cols-1 gap-4 md:grid-cols-2";
};

const CreateEmployeeModal = ({
  isOpen,
  toggleModal,
  formData,
  handleChange,
  handleSubmit,
  isEditing = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const activeStep = useMemo(() => steps[currentStep], [currentStep]);

  if (!isOpen) return null;

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = (e) => {
    if (currentStep < steps.length - 1) {
      e.preventDefault();
      goNext();
      return;
    }

    handleSubmit(e);
  };

  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/60 bg-[#fcfbff] shadow-2xl">
          <div className="border-b border-gray-200 bg-white/90 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  {isEditing ? "Employee editor" : "New employee"}
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? "Edit Employee" : "Add New Employee"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}: {activeStep.title}
                </p>
              </div>

              <button
                type="button"
                onClick={toggleModal}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800"
                aria-label="Close employee modal"
              >
                <div className="relative h-4 w-4">
                  <span className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 rotate-45 rounded-full bg-current" />
                  <span className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
                </div>
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isComplete = index < currentStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStep(index)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489]"
                          : isComplete
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                          isActive
                            ? "bg-[#CECBF6] text-[#3C3489]"
                            : isComplete
                              ? "bg-green-200 text-green-800"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isComplete ? "✓" : index + 1}
                      </span>
                      {step.title}
                    </button>
                  );
                })}
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[#7F77DD] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex max-h-[80vh] flex-col">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activeStep.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeStep.description}
                  </p>
                </div>

                {activeStep.id !== "travel" ? (
                  <div className={getGridClass(activeStep.id)}>
                    {activeStep.fields.map((field) => (
                      <div
                        key={field}
                        className={`min-w-0 space-y-1.5 ${getFieldSpanClass(
                          activeStep.id,
                          field,
                        )}`}
                      >
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                          {toLabel(field)}
                        </label>
                        <input
                          type={
                            field === "dob" || field === "availableStart"
                              ? "date"
                              : "text"
                          }
                          name={field}
                          value={formData[field] ?? ""}
                          onChange={handleChange}
                          className={baseInput}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {activeStep.fields
                        .filter((field) => field !== "rentalCarEligible")
                        .map((field) => (
                          <div key={field} className="min-w-0 space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                              {toLabel(field)}
                            </label>
                            <input
                              type="text"
                              name={field}
                              value={formData[field] ?? ""}
                              onChange={handleChange}
                              className={baseInput}
                            />
                          </div>
                        ))}
                    </div>

                    <section className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">
                            Rental car eligibility
                          </h4>
                          <p className="text-sm text-gray-500">
                            Flag whether this employee can be assigned a rental
                            car.
                          </p>
                        </div>

                        <label className="inline-flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            id="rentalCarEligible"
                            name="rentalCarEligible"
                            checked={formData.rentalCarEligible || false}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "rentalCarEligible",
                                  type: "checkbox",
                                  checked: e.target.checked,
                                  value: e.target.checked,
                                },
                              })
                            }
                            className="sr-only"
                          />
                          <span
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                              formData.rentalCarEligible
                                ? "bg-[#7F77DD]"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                formData.rentalCarEligible
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {formData.rentalCarEligible
                              ? "Eligible"
                              : "Not eligible"}
                          </span>
                        </label>
                      </div>
                    </section>
                  </div>
                )}
              </section>
            </div>

            <div className="border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-gray-400">
                  {activeStep.title}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={currentStep === 0 ? toggleModal : goBack}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    {currentStep === 0 ? "Cancel" : "Back"}
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
                  >
                    {currentStep === steps.length - 1
                      ? isEditing
                        ? "Update employee"
                        : "Save employee"
                      : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEmployeeModal;
