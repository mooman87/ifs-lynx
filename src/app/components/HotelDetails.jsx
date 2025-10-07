"use client";
import React from "react";

const HotelDetails = ({ managerHotel, staffHotel }) => {
  return (
    <div className="bg-white rounded shadow p-4 mt-8">
      <h2 className="text-xl font-semibold mb-3">Hotel Details</h2>
      <div className="grid grid-cols-1 gap-6">
        {/* Manager Hotel */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-2">Manager Hotel</h3>
          {managerHotel ? (
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                <strong>Name:</strong> {managerHotel.name}
              </li>
              <li>
                <strong>Address:</strong> {managerHotel.address}
              </li>
              <li>
                <strong>Check-in:</strong>{" "}
                {new Date(managerHotel.checkInDate).toLocaleDateString()}
              </li>
              <li>
                <strong>Check-out:</strong>{" "}
                {new Date(managerHotel.checkOutDate).toLocaleDateString()}
              </li>
            </ul>
          ) : (
            <p className="text-gray-500">Not Assigned</p>
          )}
        </div>
        {/* Staff Hotel */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-2">Staff Hotel</h3>
          {staffHotel ? (
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                <strong>Name:</strong> {staffHotel.name}
              </li>
              <li>
                <strong>Address:</strong> {staffHotel.address}
              </li>
              <li>
                <strong>Check-in:</strong>{" "}
                {new Date(staffHotel.checkInDate).toLocaleDateString()}
              </li>
              <li>
                <strong>Check-out:</strong>{" "}
                {new Date(staffHotel.checkOutDate).toLocaleDateString()}
              </li>
            </ul>
          ) : (
            <p className="text-gray-500">Not Assigned</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;
