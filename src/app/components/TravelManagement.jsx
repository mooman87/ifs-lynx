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

      <div className="overflow-x-auto">
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
      {isModalOpen && <CreateTravelDetails isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default TravelManagement;
