"use client";

import React, { useEffect, useMemo, useState } from "react";

const baseInput =
  "min-w-0 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const steps = [
  {
    id: "staff",
    title: "Staff member",
    description: "Choose who these travel details belong to.",
  },
  {
    id: "flights",
    title: "Flights",
    description: "Add one or more flights if needed.",
  },
  {
    id: "hotel",
    title: "Hotel",
    description: "Add stay details if lodging is booked.",
  },
  {
    id: "rental",
    title: "Rental car",
    description: "Add ground transportation if eligible.",
  },
];

const sectionCard = "rounded-3xl border border-gray-200 bg-white p-5 shadow-sm";

const emptyFlight = () => ({
  airline: "",
  flightNumber: "",
  departureDate: "",
  returnDate: "",
  status: "Pending",
});

const emptyHotel = () => ({
  name: "",
  address: "",
  roomNumber: "",
  checkInDate: "",
  checkOutDate: "",
});

const emptyRentalCar = () => ({
  provider: "",
  makeAndModel: "",
  licensePlate: "",
  pickUpDate: "",
  dropOffDate: "",
});

const getStaffId = (staff) => staff?._id || staff?.id || "";
const getTravelId = (travel) => travel?._id || travel?.id || "";

const normalizeFlights = (flights) =>
  Array.isArray(flights) && flights.length > 0
    ? flights.map((flight) => ({
        airline: flight.airline || "",
        flightNumber: flight.flightNumber || "",
        departureDate: flight.departureDate || "",
        returnDate: flight.returnDate || "",
        status: flight.status || "Pending",
      }))
    : [emptyFlight()];

const normalizeHotel = (hotel) => ({
  name: hotel?.name || "",
  address: hotel?.address || "",
  roomNumber: hotel?.roomNumber || "",
  checkInDate: hotel?.checkInDate || "",
  checkOutDate: hotel?.checkOutDate || "",
});

const normalizeRentalCar = (rentalCar) => ({
  provider: rentalCar?.provider || "",
  makeAndModel: rentalCar?.makeAndModel || "",
  licensePlate: rentalCar?.licensePlate || "",
  pickUpDate: rentalCar?.pickUpDate || "",
  dropOffDate: rentalCar?.dropOffDate || "",
});

const buildExpandedFlights = (flights) => {
  const nextExpanded = {};
  flights.forEach((_, idx) => {
    nextExpanded[idx] = idx === 0;
  });
  return nextExpanded;
};

const normalizeStaffList = (list = []) =>
  list.map((member) => ({
    ...member,
    id: member.id || member._id,
    _id: member.id || member._id,
    firstName: member.firstName || "",
    lastName: member.lastName || "",
    fullName:
      member.fullName ||
      `${member.firstName || ""} ${member.lastName || ""}`.trim(),
    role: member.role || "Unassigned",
    staffType: member.staffType || "employee",
    rentalCarEligible:
      member.rentalCarEligible ?? member.rental_car_eligible ?? false,
  }));

const CreateTravelDetails = ({
  isOpen,
  onClose,
  onSaved,
  existingTravel = null,
  projectId = null,
  staffOptions = [],
}) => {
  const [staff, setStaff] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedFlights, setExpandedFlights] = useState({ 0: true });
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    staffId: "",
    flights: [emptyFlight()],
    hotel: emptyHotel(),
    rentalCar: emptyRentalCar(),
    notes: "",
  });

  const selectedStaff = useMemo(() => {
    return (
      staff.find(
        (member) =>
          String(getStaffId(member)) === String(formData.staffId || ""),
      ) || null
    );
  }, [staff, formData.staffId]);

  const isEditing = Boolean(existingTravel);
  const activeStep = useMemo(() => steps[currentStep], [currentStep]);
  const progressPercent = ((currentStep + 1) / steps.length) * 100;
  const isProjectScoped = Boolean(projectId);

  const loadStaffFromApi = async () => {
    if (isProjectScoped) {
      const res = await fetch(`/api/project/${projectId}/travel`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error fetching project staff.");
      }

      return normalizeStaffList(data.staffOptions || []);
    }

    const res = await fetch("/api/employee", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error fetching staff.");
    }

    return normalizeStaffList(data.employees || []);
  };

  const normalizedProvidedStaff = useMemo(
    () => normalizeStaffList(staffOptions || []),
    [staffOptions],
  );

  useEffect(() => {
    if (!isOpen) return;

    const fetchStaff = async () => {
      try {
        setLoadingStaff(true);
        setError("");

        const list =
          normalizedProvidedStaff.length > 0
            ? normalizedProvidedStaff
            : await loadStaffFromApi();

        setStaff(list);

        const existingStaffId =
          existingTravel?.staffId ||
          existingTravel?.employee?._id ||
          existingTravel?.employee?.id ||
          "";

        const flights = normalizeFlights(existingTravel?.flights);

        const nextForm = existingTravel
          ? {
              staffId: existingStaffId,
              flights,
              hotel: normalizeHotel(existingTravel.hotel),
              rentalCar: normalizeRentalCar(existingTravel.rentalCar),
              notes: existingTravel.notes || "",
            }
          : {
              staffId: list[0]?.id || "",
              flights: [emptyFlight()],
              hotel: emptyHotel(),
              rentalCar: emptyRentalCar(),
              notes: "",
            };

        setFormData(nextForm);

        const resolvedStaffId = existingTravel
          ? existingStaffId
          : nextForm.staffId;

        setExpandedFlights(buildExpandedFlights(nextForm.flights));
        setCurrentStep(0);
      } catch (err) {
        console.error("Error fetching staff:", err);
        setError(err.message || "Error fetching staff.");
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [
    isOpen,
    existingTravel,
    projectId,
    isProjectScoped,
    normalizedProvidedStaff,
  ]);

  const staffLabel = useMemo(() => {
    if (!selectedStaff) return "No staff selected";
    return (
      selectedStaff.fullName ||
      `${selectedStaff.firstName || ""} ${selectedStaff.lastName || ""}`.trim()
    );
  }, [selectedStaff]);

  const handleChange = (e, section = null, index = null, field = null) => {
    const { name, value } = e.target;

    if (section === "flights" && index !== null) {
      setFormData((prevData) => {
        const updatedFlights = [...prevData.flights];
        updatedFlights[index][field] = value;
        return { ...prevData, flights: updatedFlights };
      });
    } else if (section) {
      setFormData((prevData) => ({
        ...prevData,
        [section]: { ...prevData[section], [name]: value },
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleStaffChange = (e) => {
    const selectedId = e.target.value;

    const found = staff.find(
      (member) => String(getStaffId(member)) === String(selectedId),
    );

    setFormData((prevData) => ({
      ...prevData,
      staffId: selectedId,
    }));
  };

  const addFlight = () => {
    setFormData((prevData) => {
      const nextFlights = [...prevData.flights, emptyFlight()];
      return { ...prevData, flights: nextFlights };
    });

    setExpandedFlights((prev) => {
      const nextIndex = formData.flights.length;
      return { ...prev, [nextIndex]: true };
    });
  };

  const removeFlight = (index) => {
    setFormData((prevData) => {
      const nextFlights = prevData.flights.filter((_, i) => i !== index);
      return {
        ...prevData,
        flights: nextFlights.length ? nextFlights : [emptyFlight()],
      };
    });

    setExpandedFlights((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        const numericKey = Number(key);
        if (numericKey < index) next[numericKey] = prev[numericKey];
        if (numericKey > index) next[numericKey - 1] = prev[numericKey];
      });
      if (!Object.keys(next).length) next[0] = true;
      return next;
    });
  };

  const toggleFlightExpanded = (index) => {
    setExpandedFlights((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      if (activeStep.id === "staff" && !formData.staffId) return;
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const buildPayload = () => ({
    projectId: projectId || existingTravel?.projectId || null,
    staffId: formData.staffId,
    flights: formData.flights,
    hotel: formData.hotel,
    rentalCar: formData.rentalCar,
    notes: formData.notes,
  });

  const onSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < steps.length - 1) {
      goNext();
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = buildPayload();
      const endpoint = isProjectScoped
        ? `/api/project/${projectId}/travel`
        : "/api/travel";
      const method = isEditing ? (isProjectScoped ? "POST" : "PUT") : "POST";

      let body;
      if (isEditing && !isProjectScoped) {
        body = JSON.stringify({
          id: getTravelId(existingTravel),
          updates: payload,
        });
      } else {
        body = JSON.stringify(payload);
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error saving travel details.");
      }

      if (onSaved) onSaved(data.travel);
      onClose();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || "Error saving travel details.");
    } finally {
      setSaving(false);
    }
  };

  const renderStaffStep = () => (
    <section className={sectionCard}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Staff member</h3>
        <p className="text-sm text-gray-500">
          {isProjectScoped
            ? "Choose a staff member already assigned to this project."
            : "Choose who these travel details belong to."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Select staff member
          </label>
          <select
            name="staffId"
            value={formData.staffId}
            onChange={handleStaffChange}
            className={baseInput}
            required
            disabled={loadingStaff || isEditing}
          >
            <option value="">
              {loadingStaff ? "Loading staff..." : "-- Select Staff Member --"}
            </option>
            {staff.map((member) => {
              const id = getStaffId(member);
              return (
                <option key={id} value={id}>
                  {member.fullName ||
                    `${member.firstName} ${member.lastName}`.trim()}
                </option>
              );
            })}
          </select>
          {isEditing ? (
            <p className="text-xs text-gray-500">
              Staff assignment is locked while editing an existing travel
              record.
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Selected
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {staffLabel}
          </p>
          {selectedStaff && (
            <>
              <p className="mt-1 text-xs text-gray-500">
                {selectedStaff.staffType || "employee"} ·{" "}
                {selectedStaff.role || "Unassigned"}
              </p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  selectedStaff.rentalCarEligible
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {selectedStaff.rentalCarEligible
                  ? "Eligible for rental car"
                  : "Not eligible for rental car"}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );

  const renderFlightsStep = () => (
    <section className={sectionCard}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Flights</h3>
          <p className="text-sm text-gray-500">
            Add one or more flights if needed.
          </p>
        </div>

        <button
          type="button"
          onClick={addFlight}
          className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
        >
          + Add flight
        </button>
      </div>

      <div className="space-y-3">
        {formData.flights.map((flight, index) => {
          const isExpanded = expandedFlights[index] ?? index === 0;
          const flightTitle =
            flight.airline || flight.flightNumber
              ? `${flight.airline || "Unnamed airline"}${flight.flightNumber ? ` • ${flight.flightNumber}` : ""}`
              : `Flight ${index + 1}`;

          const summaryBits = [
            flight.departureDate || "No departure",
            flight.returnDate || "No return",
            flight.status || "Pending",
          ];

          return (
            <div
              key={index}
              className="rounded-3xl border border-gray-200 bg-gray-50"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-4">
                <button
                  type="button"
                  onClick={() => toggleFlightExpanded(index)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {flightTitle}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {summaryBits.join(" • ")}
                  </p>
                </button>

                <div className="flex items-center gap-2">
                  {formData.flights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFlight(index)}
                      className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      Remove
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleFlightExpanded(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
                    aria-label={
                      isExpanded ? "Collapse flight" : "Expand flight"
                    }
                  >
                    <span
                      className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      ▾
                    </span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 px-4 pb-4 pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        Airline
                      </label>
                      <input
                        type="text"
                        value={flight.airline}
                        onChange={(e) =>
                          handleChange(e, "flights", index, "airline")
                        }
                        className={baseInput}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        Flight number
                      </label>
                      <input
                        type="text"
                        value={flight.flightNumber}
                        onChange={(e) =>
                          handleChange(e, "flights", index, "flightNumber")
                        }
                        className={baseInput}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        Departure date
                      </label>
                      <input
                        type="date"
                        value={flight.departureDate}
                        onChange={(e) =>
                          handleChange(e, "flights", index, "departureDate")
                        }
                        className={baseInput}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        Return date
                      </label>
                      <input
                        type="date"
                        value={flight.returnDate}
                        onChange={(e) =>
                          handleChange(e, "flights", index, "returnDate")
                        }
                        className={baseInput}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                        Status
                      </label>
                      <select
                        value={flight.status}
                        onChange={(e) =>
                          handleChange(e, "flights", index, "status")
                        }
                        className={baseInput}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Booked">Booked</option>
                        <option value="Checked In">Checked In</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderHotelStep = () => (
    <section className={sectionCard}>
      <div className="mb-4">
        <div className="mb-1 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
          Stay
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Hotel</h3>
        <p className="text-sm text-gray-500">
          Add stay details if lodging is booked.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1.4fr_0.7fr]">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Hotel name
            </label>
            <input
              type="text"
              name="name"
              value={formData.hotel.name}
              onChange={(e) => handleChange(e, "hotel")}
              className={baseInput}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.hotel.address}
              onChange={(e) => handleChange(e, "hotel")}
              className={baseInput}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Room number
            </label>
            <input
              type="text"
              name="roomNumber"
              value={formData.hotel.roomNumber}
              onChange={(e) => handleChange(e, "hotel")}
              className={baseInput}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Check-in
            </label>
            <input
              type="date"
              name="checkInDate"
              value={formData.hotel.checkInDate}
              onChange={(e) => handleChange(e, "hotel")}
              className={baseInput}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Check-out
            </label>
            <input
              type="date"
              name="checkOutDate"
              value={formData.hotel.checkOutDate}
              onChange={(e) => handleChange(e, "hotel")}
              className={baseInput}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className={baseInput}
            placeholder="Optional hotel, travel, or coordination notes"
          />
        </div>
      </div>
    </section>
  );

  const renderRentalStep = () => {
    const isRentalEligible =
      selectedStaff?.rentalCarEligible ??
      selectedStaff?.rental_car_eligible ??
      false;

    if (!isRentalEligible) {
      return (
        <section className={sectionCard}>
          <div className="mb-4">
            <div className="mb-1 inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              Not available
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Rental car</h3>
            <p className="text-sm text-gray-500">
              This staff member is not eligible for a rental car.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-700">
              Rental car entry skipped
            </p>
            <p className="mt-1 text-sm text-gray-500">
              You can still save flights and hotel details for this staff
              member.
            </p>
          </div>
        </section>
      );
    }

    return (
      <section className={sectionCard}>
        <div className="mb-4">
          <div className="mb-1 inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            Ground transport
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Rental car</h3>
          <p className="text-sm text-gray-500">
            Add provider and vehicle details for this staff member.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Provider
            </label>
            <input
              type="text"
              name="provider"
              value={formData.rentalCar.provider}
              onChange={(e) => handleChange(e, "rentalCar")}
              className={baseInput}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Make & model
            </label>
            <input
              type="text"
              name="makeAndModel"
              value={formData.rentalCar.makeAndModel}
              onChange={(e) => handleChange(e, "rentalCar")}
              className={baseInput}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              License plate
            </label>
            <input
              type="text"
              name="licensePlate"
              value={formData.rentalCar.licensePlate}
              onChange={(e) => handleChange(e, "rentalCar")}
              className={baseInput}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Pick-up date
              </label>
              <input
                type="date"
                name="pickUpDate"
                value={formData.rentalCar.pickUpDate}
                onChange={(e) => handleChange(e, "rentalCar")}
                className={baseInput}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Drop-off date
              </label>
              <input
                type="date"
                name="dropOffDate"
                value={formData.rentalCar.dropOffDate}
                onChange={(e) => handleChange(e, "rentalCar")}
                className={baseInput}
              />
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderStep = () => {
    switch (activeStep.id) {
      case "staff":
        return renderStaffStep();
      case "flights":
        return renderFlightsStep();
      case "hotel":
        return renderHotelStep();
      case "rental":
        return renderRentalStep();
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/60 bg-[#fcfbff] shadow-2xl">
          <div className="border-b border-gray-200 bg-white/90 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Travel planner
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? "Edit Travel Details" : "Add Travel Details"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}: {activeStep.title}
                  {isProjectScoped ? " · Project scoped" : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800"
                aria-label="Close travel modal"
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

          <form onSubmit={onSubmit} className="flex max-h-[82vh] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {renderStep()}
            </div>

            <div className="border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-gray-400">
                  {activeStep.title}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={currentStep === 0 ? onClose : goBack}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    {currentStep === 0 ? "Cancel" : "Back"}
                  </button>

                  <button
                    type="submit"
                    disabled={saving || loadingStaff}
                    className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {currentStep === steps.length - 1
                      ? saving
                        ? isEditing
                          ? "Saving changes..."
                          : "Saving travel..."
                        : isEditing
                          ? "Save changes"
                          : "Save travel details"
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

export default CreateTravelDetails;
