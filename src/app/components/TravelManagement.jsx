"use client";

import React, { useEffect, useMemo, useState } from "react";
import CreateTravelDetails from "./CreateTravelDetails";

const getInitials = (firstName = "", lastName = "") =>
  `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

const getTravelId = (travel) => travel?._id || travel?.id || "";

const emptyForm = {
  staffId: "",
  notes: "",
  flights: [
    {
      airline: "",
      flightNumber: "",
      status: "",
      departureAirport: "",
      arrivalAirport: "",
      departureTime: "",
      arrivalTime: "",
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
    makeAndModel: "",
    licensePlate: "",
    pickupDate: "",
    dropoffDate: "",
  },
};

const hasFlightData = (flight = {}) =>
  Boolean(
    flight.airline ||
    flight.flightNumber ||
    flight.status ||
    flight.departureAirport ||
    flight.arrivalAirport ||
    flight.departureTime ||
    flight.arrivalTime,
  );

const hasHotelData = (hotel = {}) =>
  Boolean(
    hotel.name ||
    hotel.address ||
    hotel.roomNumber ||
    hotel.checkInDate ||
    hotel.checkOutDate,
  );

const hasRentalData = (rentalCar = {}) =>
  Boolean(
    rentalCar.makeAndModel ||
    rentalCar.licensePlate ||
    rentalCar.pickupDate ||
    rentalCar.dropoffDate,
  );

const normalizeFormFromTravel = (travel) => ({
  staffId: travel?.staffId || travel?.employee?.id || "",
  notes: travel?.notes || "",
  flights:
    Array.isArray(travel?.flights) && travel.flights.length > 0
      ? travel.flights.map((flight) => ({
          airline: flight.airline || "",
          flightNumber: flight.flightNumber || "",
          status: flight.status || "",
          departureAirport: flight.departureAirport || "",
          arrivalAirport: flight.arrivalAirport || "",
          departureTime: flight.departureTime || "",
          arrivalTime: flight.arrivalTime || "",
        }))
      : [...emptyForm.flights],
  hotel: {
    name: travel?.hotel?.name || "",
    address: travel?.hotel?.address || "",
    roomNumber: travel?.hotel?.roomNumber || "",
    checkInDate: travel?.hotel?.checkInDate || "",
    checkOutDate: travel?.hotel?.checkOutDate || "",
  },
  rentalCar: {
    makeAndModel: travel?.rentalCar?.makeAndModel || "",
    licensePlate: travel?.rentalCar?.licensePlate || "",
    pickupDate: travel?.rentalCar?.pickupDate || "",
    dropoffDate: travel?.rentalCar?.dropoffDate || "",
  },
});

const TravelManagement = ({
  projectId,
  assignedEmployees = [],
  managerHotel,
  staffHotel,
}) => {
  const [travelData, setTravelData] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [error, setError] = useState("");
  const [savingError, setSavingError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTravel, setEditingTravel] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const effectiveStaffOptions = useMemo(() => {
    const byId = new Map();

    (assignedEmployees || []).forEach((staff) => {
      const id = staff.id || staff._id;
      if (!id) return;

      byId.set(id, {
        id,
        _id: id,
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        fullName:
          staff.fullName ||
          `${staff.firstName || ""} ${staff.lastName || ""}`.trim(),
        email: staff.email || "",
        role: staff.role || "Unassigned",
        staffType: staff.staffType || "employee",
        rentalCarEligible:
          staff.rentalCarEligible ?? staff.rental_car_eligible ?? true,
      });
    });

    (staffOptions || []).forEach((staff) => {
      const id = staff.id || staff._id;
      if (!id) return;

      const existing = byId.get(id) || {};
      byId.set(id, {
        ...existing,
        id,
        _id: id,
        firstName: staff.firstName ?? existing.firstName ?? "",
        lastName: staff.lastName ?? existing.lastName ?? "",
        fullName:
          staff.fullName ||
          existing.fullName ||
          `${staff.firstName || ""} ${staff.lastName || ""}`.trim(),
        email: staff.email ?? existing.email ?? "",
        role: staff.role ?? existing.role ?? "Unassigned",
        staffType: staff.staffType ?? existing.staffType ?? "employee",
        rentalCarEligible:
          staff.rentalCarEligible ??
          staff.rental_car_eligible ??
          existing.rentalCarEligible ??
          true,
      });
    });

    return Array.from(byId.values());
  }, [assignedEmployees, staffOptions]);

  const fetchTravelData = async () => {
    if (!projectId) return;

    try {
      setError("");
      const res = await fetch(`/api/project/${projectId}/travel`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error fetching project travel.");
      }

      setTravelData(data.travels || []);
      setStaffOptions(data.staffOptions || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching project travel.");
    }
  };

  useEffect(() => {
    fetchTravelData();
  }, [projectId]);

  const totalFlights = useMemo(
    () =>
      travelData.reduce(
        (sum, travel) =>
          sum + (Array.isArray(travel.flights) ? travel.flights.length : 0),
        0,
      ),
    [travelData],
  );

  const totalHotels = useMemo(
    () => travelData.filter((travel) => travel.hotel?.name).length,
    [travelData],
  );

  const totalRentalCars = useMemo(
    () => travelData.filter((travel) => travel.rentalCar?.makeAndModel).length,
    [travelData],
  );

  const openCreate = () => {
    setEditingTravel(null);
    setSavingError("");
    setIsModalOpen(true);
  };

  const openEdit = (travel) => {
    setEditingTravel(travel);
    setForm(normalizeFormFromTravel(travel));
    setSavingError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTravel(null);
    setForm(emptyForm);
    setSavingError("");
  };

  const buildPayload = () => ({
    projectId,
    staffId: form.staffId,
    notes: form.notes?.trim() || "",
    flights: form.flights.filter(hasFlightData),
    hotel: hasHotelData(form.hotel) ? form.hotel : null,
    rentalCar: hasRentalData(form.rentalCar) ? form.rentalCar : null,
  });

  const handleDelete = async (travel) => {
    const travelId = getTravelId(travel);
    if (!travelId) return;

    const confirmed = window.confirm(
      "Delete this travel record? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      setSavingError("");
      const res = await fetch(`/api/project/${projectId}/travel`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ travelId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete travel.");

      await fetchTravelData();
    } catch (err) {
      console.error(err);
      setSavingError(err.message || "Failed to delete travel.");
    }
  };

  const handleSaved = async () => {
    await fetchTravelData();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Logistics hub
            </h2>
            <p className="text-sm text-gray-500">
              Hotels, flights, and ground transportation for staff assigned to
              this project.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
          >
            + Add travel details
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Manager hotel
            </p>
            <p className="text-base font-semibold text-gray-900">
              {managerHotel?.name || "Not assigned"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {managerHotel?.address || "No address on file"}
            </p>
          </div>

          <div className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Staff hotel
            </p>
            <p className="text-base font-semibold text-gray-900">
              {staffHotel?.name || "Not assigned"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {staffHotel?.address || "No address on file"}
            </p>
          </div>

          <div className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Travel records
            </p>
            <p className="text-3xl font-bold text-purple-700">
              {travelData.length}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Flights tracked
            </p>
            <p className="text-3xl font-bold text-gray-900">{totalFlights}</p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
              Ground + stay
            </p>
            <p className="text-3xl font-bold text-emerald-700">
              {totalHotels + totalRentalCars}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {savingError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {savingError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {travelData.map((travel) => {
          const fullName =
            travel.employee?.fullName ||
            `${travel.employee?.firstName || ""} ${travel.employee?.lastName || ""}`.trim();

          const flights = Array.isArray(travel.flights) ? travel.flights : [];
          const primaryFlight = flights[0];
          const hasFlights = flights.length > 0;

          return (
            <div
              key={getTravelId(travel)}
              className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#CECBF6] text-sm font-semibold text-[#3C3489]">
                    {getInitials(
                      travel.employee?.firstName,
                      travel.employee?.lastName,
                    ) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {fullName || "Unassigned"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hasFlights
                        ? `${flights.length} flight(s)`
                        : "No flights"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(travel)}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(travel)}
                    className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                    Flights
                  </p>
                  {hasFlights ? (
                    <div className="mt-1 space-y-1">
                      <p className="font-medium">
                        {primaryFlight.airline || "Airline TBD"} -{" "}
                        {primaryFlight.flightNumber || "Flight TBD"} (
                        {primaryFlight.status || "Pending"})
                      </p>
                      {flights.length > 1 ? (
                        <p className="text-xs text-gray-500">
                          + {flights.length - 1} more flight
                          {flights.length - 1 > 1 ? "s" : ""}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-1 text-gray-400">No flights</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                      Hotel
                    </p>
                    <p className="mt-1">
                      {travel.hotel?.name
                        ? `${travel.hotel.name}, Room ${travel.hotel.roomNumber || "TBD"}`
                        : "No hotel"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                      Rental
                    </p>
                    <p className="mt-1">
                      {travel.rentalCar?.makeAndModel
                        ? `${travel.rentalCar.makeAndModel} (${travel.rentalCar.licensePlate || "No plate"})`
                        : "No rental car"}
                    </p>
                  </div>
                </div>

                {travel.notes ? (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                      Notes
                    </p>
                    <p className="mt-1 text-gray-600">{travel.notes}</p>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {travelData.length === 0 && !error ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm xl:col-span-2">
            No project travel records yet.
          </div>
        ) : null}
      </div>

      {isModalOpen ? (
        <CreateTravelDetails
          isOpen={isModalOpen}
          existingTravel={editingTravel}
          projectId={projectId}
          staffOptions={effectiveStaffOptions}
          onSaved={handleSaved}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
};

export default TravelManagement;
