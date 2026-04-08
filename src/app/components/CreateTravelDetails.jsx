"use client";

import React, { useEffect, useMemo, useState } from "react";

const baseInput =
  "min-w-0 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const steps = [
  {
    id: "employee",
    title: "Employee",
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

const CreateTravelDetails = ({ isOpen, onClose }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedFlights, setExpandedFlights] = useState({ 0: true });

  const [formData, setFormData] = useState({
    employee: "",
    flights: [
      {
        airline: "",
        flightNumber: "",
        departureDate: "",
        returnDate: "",
        status: "Pending",
      },
    ],
    hotel: {
      name: "",
      address: "",
      roomNumber: "",
      checkInDate: "",
      checkOutDate: "",
    },
    rentalCar: {
      provider: "",
      makeAndModel: "",
      licensePlate: "",
      pickUpDate: "",
      dropOffDate: "",
    },
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/employee");
        const data = await res.json();
        if (res.ok) {
          setEmployees(data.employees);
        } else {
          console.error("Error fetching employees.");
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    fetchEmployees();
  }, []);

  const activeStep = useMemo(() => steps[currentStep], [currentStep]);
  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  const employeeLabel = useMemo(() => {
    if (!selectedEmployee) return "No employee selected";
    return `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;
  }, [selectedEmployee]);

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

  const handleEmployeeChange = (e) => {
    const selectedId = e.target.value;
    setFormData((prevData) => ({ ...prevData, employee: selectedId }));

    const selectedEmp = employees.find((emp) => emp._id === selectedId);
    setSelectedEmployee(selectedEmp || null);
  };

  const addFlight = () => {
    setFormData((prevData) => {
      const nextFlights = [
        ...prevData.flights,
        {
          airline: "",
          flightNumber: "",
          departureDate: "",
          returnDate: "",
          status: "Pending",
        },
      ];
      return { ...prevData, flights: nextFlights };
    });

    setExpandedFlights((prev) => {
      const nextIndex = formData.flights.length;
      return { ...prev, [nextIndex]: true };
    });
  };

  const removeFlight = (index) => {
    setFormData((prevData) => ({
      ...prevData,
      flights: prevData.flights.filter((_, i) => i !== index),
    }));

    setExpandedFlights((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        const numericKey = Number(key);
        if (numericKey < index) next[numericKey] = prev[numericKey];
        if (numericKey > index) next[numericKey - 1] = prev[numericKey];
      });
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
      if (activeStep.id === "employee" && !formData.employee) return;
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < steps.length - 1) {
      goNext();
      return;
    }

    try {
      const res = await fetch("/api/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onClose();
      } else {
        alert("Error saving travel details.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderEmployeeStep = () => (
    <section className={sectionCard}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Employee</h3>
        <p className="text-sm text-gray-500">
          Choose who these travel details belong to.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Select employee
          </label>
          <select
            name="employee"
            value={formData.employee}
            onChange={handleEmployeeChange}
            className={baseInput}
            required
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Selected
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {employeeLabel}
          </p>
          {selectedEmployee && (
            <p
              className={`mt-2 text-sm font-semibold ${
                selectedEmployee.rentalCarEligible
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {selectedEmployee.rentalCarEligible
                ? "✅ Eligible for rental car"
                : "❌ Not eligible for rental car"}
            </p>
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
              ? `${flight.airline || "Unnamed airline"} ${flight.flightNumber ? `• ${flight.flightNumber}` : ""}`
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
      </div>
    </section>
  );

  const renderRentalStep = () => {
    if (!selectedEmployee?.rentalCarEligible) {
      return (
        <section className={sectionCard}>
          <div className="mb-4">
            <div className="mb-1 inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              Not available
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Rental car</h3>
            <p className="text-sm text-gray-500">
              This employee is not eligible for a rental car.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-700">
              Rental car entry skipped
            </p>
            <p className="mt-1 text-sm text-gray-500">
              You can still save flights and hotel details for this employee.
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
            Add provider and vehicle details for this employee.
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
      case "employee":
        return renderEmployeeStep();
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
                  Add Travel Details
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}: {activeStep.title}
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
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
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
                    className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
                  >
                    {currentStep === steps.length - 1
                      ? "Save travel details"
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
