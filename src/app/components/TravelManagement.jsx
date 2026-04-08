"use client";

import React, { useEffect, useMemo, useState } from "react";
import CreateTravelDetails from "./CreateTravelDetails";

const getInitials = (firstName = "", lastName = "") =>
  `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

const TravelManagement = () => {
  const [travelData, setTravelData] = useState([]);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTravelData = async () => {
    try {
      const res = await fetch("/api/travel");
      const data = await res.json();
      if (res.ok) {
        setTravelData(data.travels);
      } else {
        setError(data.message || "Error fetching travel details.");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching travel details.");
    }
  };

  useEffect(() => {
    fetchTravelData();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Travel Management
          </h1>
          <p className="text-sm text-gray-500">
            Flights, hotels, and ground transportation across your team.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
        >
          + Add travel details
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

      <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                  Flights
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                  Hotel
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                  Rental Car
                </th>
              </tr>
            </thead>

            <tbody>
              {travelData.map((travel, index) => {
                const firstName = travel.employee?.firstName || "";
                const lastName = travel.employee?.lastName || "";
                const fullName = `${firstName} ${lastName}`.trim();

                return (
                  <tr
                    key={travel._id}
                    className={`hover:bg-[#f8f7fd] transition ${
                      index !== travelData.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CECBF6] text-sm font-semibold text-[#3C3489]">
                          {getInitials(firstName, lastName)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {fullName || "Unassigned"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Staff travel record
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {travel.flights?.length > 0 ? (
                        <div className="space-y-1">
                          {travel.flights.map((flight, fIndex) => (
                            <p key={fIndex}>
                              {flight.airline} - {flight.flightNumber} (
                              {flight.status})
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">No flights</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {travel.hotel?.name ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {travel.hotel.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Room {travel.hotel.roomNumber || "TBD"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">No hotel booked</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {travel.rentalCar?.makeAndModel ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {travel.rentalCar.makeAndModel}
                          </p>
                          <p className="text-xs text-gray-500">
                            {travel.rentalCar.licensePlate || "No plate"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">No rental car</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {travelData.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No travel records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {travelData.map((travel) => {
          const fullName = `${travel.employee?.firstName || ""} ${
            travel.employee?.lastName || ""
          }`.trim();

          const hasFlights = travel.flights && travel.flights.length > 0;
          const primaryFlight = hasFlights ? travel.flights[0] : null;

          return (
            <div
              key={travel._id}
              className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CECBF6] text-sm font-semibold text-[#3C3489]">
                    {getInitials(
                      travel.employee?.firstName,
                      travel.employee?.lastName,
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {fullName || "Unassigned"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hasFlights
                        ? `${travel.flights.length} flight(s)`
                        : "No flights"}
                    </p>
                  </div>
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
                        {primaryFlight.airline} - {primaryFlight.flightNumber} (
                        {primaryFlight.status})
                      </p>
                      {travel.flights.length > 1 && (
                        <p className="text-xs text-gray-500">
                          + {travel.flights.length - 1} more flight
                          {travel.flights.length - 1 > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-gray-400">No flights</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
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
              </div>
            </div>
          );
        })}

        {travelData.length === 0 && !error && (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            No travel records yet.
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateTravelDetails
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            fetchTravelData();
          }}
        />
      )}
    </div>
  );
};

export default TravelManagement;
