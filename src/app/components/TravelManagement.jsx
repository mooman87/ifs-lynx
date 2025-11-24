"use client";

import React, { useEffect, useState } from "react";
import CreateTravelDetails from "./CreateTravelDetails"; 

const TravelManagement = () => {
  const [travelData, setTravelData] = useState([]);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
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

    fetchTravelData();
  }, []);

  return (
    <div className="widget">
      <div className="flex items-center mb-5 gap-2">
      <span className="font-bold text-2xl">Travel Management</span>
        <button onClick={() => setIsModalOpen(true)} className="add-btn">
          <span className="text-lg font-semibold">+ Add</span>
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Employee</th>
              <th className="py-3 px-6 text-left">Flights</th>
              <th className="py-3 px-6 text-left">Hotel</th>
              <th className="py-3 px-6 text-left">Rental Car</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {travelData.map((travel) => (
              <tr key={travel._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left">{travel.employee?.firstName} {travel.employee?.lastName}</td>
                <td className="py-3 px-6 text-left">
                  {travel.flights.length > 0 ? (
                    travel.flights.map((flight, index) => (
                      <p key={index}>{flight.airline} - {flight.flightNumber} ({flight.status})</p>
                    ))
                  ) : (
                    "No flights"
                  )}
                </td>
                <td className="py-3 px-6 text-left">
                  {travel.hotel ? `${travel.hotel.name}, Room ${travel.hotel.roomNumber}` : "No hotel booked"}
                </td>
                <td className="py-3 px-6 text-left">
                  {travel.rentalCar ? `${travel.rentalCar.makeAndModel} (${travel.rentalCar.licensePlate})` : "No rental car"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {travelData.map((travel) => {
          const fullName = `${travel.employee?.firstName || ""} ${
            travel.employee?.lastName || ""
          }`.trim();

          const hasFlights = travel.flights && travel.flights.length > 0;
          const primaryFlight = hasFlights ? travel.flights[0] : null;

          return (
            <div
              key={travel._id}
              className="bg-white rounded-2xl shadow border border-gray-200 p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[0.65rem] uppercase tracking-wide text-gray-400">
                    Employee
                  </p>
                  <p className="mt-1 font-semibold text-gray-900 text-sm leading-snug">
                    {fullName || "Unassigned"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[0.65rem] uppercase tracking-wide text-gray-400">
                    Trips
                  </p>
                  <p className="mt-1 text-xs text-gray-700">
                    {hasFlights ? `${travel.flights.length} flight(s)` : "No flights"}
                  </p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs text-gray-700">
                <div className="col-span-1 sm:col-span-2">
                  <p className="font-semibold text-[0.65rem] uppercase tracking-wide text-gray-400">
                    Flights
                  </p>
                  {hasFlights ? (
                    <div className="mt-1 space-y-1">
                      <p className="font-medium">
                        {primaryFlight.airline} - {primaryFlight.flightNumber} (
                        {primaryFlight.status})
                      </p>
                      {travel.flights.length > 1 && (
                        <p className="text-[0.7rem] text-gray-500">
                          + {travel.flights.length - 1} more flight
                          {travel.flights.length - 1 > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-gray-500">No flights</p>
                  )}
                </div>
                <div className="col-span-1">
                  <p className="font-semibold text-[0.65rem] uppercase tracking-wide text-gray-400">
                    Hotel
                  </p>
                  <p className="mt-1">
                    {travel.hotel
                      ? `${travel.hotel.name}, Room ${travel.hotel.roomNumber}`
                      : "No hotel"}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="font-semibold text-[0.65rem] uppercase tracking-wide text-gray-400">
                    Rental
                  </p>
                  <p className="mt-1">
                    {travel.rentalCar
                      ? `${travel.rentalCar.makeAndModel} (${travel.rentalCar.licensePlate})`
                      : "No rental car"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {isModalOpen && <CreateTravelDetails isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default TravelManagement;
