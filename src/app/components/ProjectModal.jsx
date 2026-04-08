"use client";

import React, { useEffect, useMemo, useState } from "react";

const toLabel = (key = "") =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

const baseInput =
  "min-w-0 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const sectionCard =
  "min-w-0 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm";

const ProjectModal = ({
  isOpen,
  toggleModal,
  formData,
  handleSubmit,
  isEditing = false,
}) => {
  const safeFormData = useMemo(
    () => (formData && typeof formData === "object" ? formData : {}),
    [formData],
  );

  const [localFormData, setLocalFormData] = useState(safeFormData);

  useEffect(() => {
    setLocalFormData(safeFormData);
  }, [safeFormData]);

  const handleEditChange = (e, section = null, field = null) => {
    const { name, value } = e.target;

    if (section) {
      setLocalFormData((prev) => ({
        ...(prev || {}),
        [section]: {
          ...((prev && prev[section]) || {}),
          [field]: value,
        },
      }));
    } else {
      setLocalFormData((prev) => ({
        ...(prev || {}),
        [name]: value,
      }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(localFormData || {});
  };

  if (!isOpen) return null;

  const scalarKeys = Object.keys(localFormData || {}).filter((k) => {
    const v = localFormData?.[k];
    if (v === null || v === undefined) return true;
    return typeof v !== "object";
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/60 bg-[#fcfbff] shadow-2xl">
          <div className="border-b border-gray-200 bg-white/90 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  {isEditing ? "Project editor" : "New project"}
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? "Edit Project" : "Create Project"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update project basics and logistics without leaving the
                  workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleModal}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800"
                aria-label="Close project modal"
              >
                <div className="relative h-4 w-4">
                  <span className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 rotate-45 rounded-full bg-current" />
                  <span className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
                </div>
              </button>
            </div>
          </div>

          <form
            onSubmit={handleFormSubmit}
            className="max-h-[82vh] overflow-y-auto"
          >
            <div className="space-y-5 p-5 sm:p-6">
              <section className={sectionCard}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Core project details
                  </h3>
                  <p className="text-sm text-gray-500">
                    Campaign identity, dates, goals, and leadership fields.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {scalarKeys.map((field) => {
                    const inputType = field.toLowerCase().includes("date")
                      ? "date"
                      : "text";

                    return (
                      <div key={field} className="min-w-0 space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                          {toLabel(field)}
                        </label>
                        <input
                          type={inputType}
                          name={field}
                          placeholder={toLabel(field)}
                          value={localFormData?.[field] ?? ""}
                          onChange={handleEditChange}
                          className={baseInput}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section className={sectionCard}>
                  <div className="mb-4">
                    <div className="mb-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      Manager lodging
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Manager hotel
                    </h3>
                    <p className="text-sm text-gray-500">
                      Add location and check-in details for leadership travel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        Hotel name
                      </label>
                      <input
                        type="text"
                        placeholder="Hotel Name"
                        value={localFormData?.managerHotel?.name || ""}
                        onChange={(e) =>
                          handleEditChange(e, "managerHotel", "name")
                        }
                        className={baseInput}
                      />
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        Address
                      </label>
                      <input
                        type="text"
                        placeholder="Address"
                        value={localFormData?.managerHotel?.address || ""}
                        onChange={(e) =>
                          handleEditChange(e, "managerHotel", "address")
                        }
                        className={baseInput}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="min-w-0 space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                          Check-in
                        </label>
                        <input
                          type="date"
                          value={localFormData?.managerHotel?.checkInDate || ""}
                          onChange={(e) =>
                            handleEditChange(e, "managerHotel", "checkInDate")
                          }
                          className={baseInput}
                        />
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                          Check-out
                        </label>
                        <input
                          type="date"
                          value={
                            localFormData?.managerHotel?.checkOutDate || ""
                          }
                          onChange={(e) =>
                            handleEditChange(e, "managerHotel", "checkOutDate")
                          }
                          className={baseInput}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className={sectionCard}>
                  <div className="mb-4">
                    <div className="mb-1 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
                      Staff lodging
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Staff hotel
                    </h3>
                    <p className="text-sm text-gray-500">
                      Track where team members are housed during the project.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        Hotel name
                      </label>
                      <input
                        type="text"
                        placeholder="Hotel Name"
                        value={localFormData?.staffHotel?.name || ""}
                        onChange={(e) =>
                          handleEditChange(e, "staffHotel", "name")
                        }
                        className={baseInput}
                      />
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        Address
                      </label>
                      <input
                        type="text"
                        placeholder="Address"
                        value={localFormData?.staffHotel?.address || ""}
                        onChange={(e) =>
                          handleEditChange(e, "staffHotel", "address")
                        }
                        className={baseInput}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="min-w-0 space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                          Check-in
                        </label>
                        <input
                          type="date"
                          value={localFormData?.staffHotel?.checkInDate || ""}
                          onChange={(e) =>
                            handleEditChange(e, "staffHotel", "checkInDate")
                          }
                          className={baseInput}
                        />
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                          Check-out
                        </label>
                        <input
                          type="date"
                          value={localFormData?.staffHotel?.checkOutDate || ""}
                          onChange={(e) =>
                            handleEditChange(e, "staffHotel", "checkOutDate")
                          }
                          className={baseInput}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={toggleModal}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
                >
                  {isEditing ? "Update project" : "Save project"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
