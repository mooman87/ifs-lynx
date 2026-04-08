"use client";
import React from "react";

const HotelCard = ({ title, hotel, accent }) => (
  <div className={`rounded-[28px] border bg-white p-5 shadow-sm ${accent}`}>
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>

    {hotel ? (
      <ul className="space-y-3 text-sm text-gray-700">
        <li className="rounded-2xl bg-gray-50 px-4 py-3">
          <span className="block text-xs uppercase tracking-[0.14em] text-gray-400 mb-1">Name</span>
          <span className="font-medium text-gray-900">{hotel.name}</span>
        </li>
        <li className="rounded-2xl bg-gray-50 px-4 py-3">
          <span className="block text-xs uppercase tracking-[0.14em] text-gray-400 mb-1">Address</span>
          <span>{hotel.address}</span>
        </li>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <li className="rounded-2xl bg-gray-50 px-4 py-3 list-none">
            <span className="block text-xs uppercase tracking-[0.14em] text-gray-400 mb-1">Check-in</span>
            <span className="font-medium text-gray-900">{new Date(hotel.checkInDate).toLocaleDateString()}</span>
          </li>
          <li className="rounded-2xl bg-gray-50 px-4 py-3 list-none">
            <span className="block text-xs uppercase tracking-[0.14em] text-gray-400 mb-1">Check-out</span>
            <span className="font-medium text-gray-900">{new Date(hotel.checkOutDate).toLocaleDateString()}</span>
          </li>
        </div>
      </ul>
    ) : (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500 text-center">
        Not assigned
      </div>
    )}
  </div>
);

const HotelDetails = ({ managerHotel, staffHotel }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <HotelCard title="Manager Hotel" hotel={managerHotel} accent="border-amber-100" />
      <HotelCard title="Staff Hotel" hotel={staffHotel} accent="border-purple-100" />
    </div>
  );
};

export default HotelDetails;
