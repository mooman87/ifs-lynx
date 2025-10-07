"use client";

import React, { useState, useEffect } from "react";

const CreateTravelDetails = ({ isOpen, onClose }) => {
  const [employees, setEmployees] = useState([]); 
  const [selectedEmployee, setSelectedEmployee] = useState(null); 
  const [formData, setFormData] = useState({
    employee: "",
    flights: [{ airline: "", flightNumber: "", departureDate: "", returnDate: "", status: "Pending" }],
    hotel: { name: "", address: "", roomNumber: "", checkInDate: "", checkOutDate: "" },
    rentalCar: { provider: "", makeAndModel: "", licensePlate: "", pickUpDate: "", dropOffDate: "" },
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
    setFormData((prevData) => ({
      ...prevData,
      flights: [...prevData.flights, { airline: "", flightNumber: "", departureDate: "", returnDate: "", status: "Pending" }],
    }));
  };

  const removeFlight = (index) => {
    setFormData((prevData) => ({
      ...prevData,
      flights: prevData.flights.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/2 overflow-auto max-h-[80vh]">
        <h2 className="text-xl font-bold mb-4">Add Travel Details</h2>
        <form onSubmit={handleSubmit}>

          <div className="mb-4">
            <label className="block font-semibold">Select Employee<span className="text-red-500">*</span>:</label>
            <select
              name="employee"
              value={formData.employee}
              onChange={handleEmployeeChange}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">-- Select Employee --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>

            {selectedEmployee && (
              <p className={`mt-2 text-sm font-semibold ${selectedEmployee.rentalCarEligible ? "text-green-600" : "text-red-600"}`}>
                {selectedEmployee.rentalCarEligible ? "✅ Eligible for rental car" : "❌ Not eligible for rental car"}
              </p>
            )}
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Flights (Optional)</h3>
            {formData.flights.map((flight, index) => (
              <div key={index} className="border p-3 mb-2 rounded bg-gray-100">
                <label className="block">Airline:</label>
                <input type="text" value={flight.airline} onChange={(e) => handleChange(e, "flights", index, "airline")} className="border p-2 rounded w-full mb-2" />
                
                <label className="block">Flight Number:</label>
                <input type="text" value={flight.flightNumber} onChange={(e) => handleChange(e, "flights", index, "flightNumber")} className="border p-2 rounded w-full mb-2" />

                <button type="button" onClick={() => removeFlight(index)} className="px-3 py-1 bg-red-500 text-white rounded mt-2">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addFlight} className="px-3 py-1 bg-blue-500 text-white rounded">+ Add Flight</button>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Hotel (Optional)</h3>
            <label className="block">Hotel Name:</label>
            <input type="text" name="name" value={formData.hotel.name} onChange={(e) => handleChange(e, "hotel")} className="border p-2 rounded w-full mb-2" />

            <label className="block">Room Number:</label>
            <input type="text" name="roomNumber" value={formData.hotel.roomNumber} onChange={(e) => handleChange(e, "hotel")} className="border p-2 rounded w-full mb-2" />
          </div>

          {selectedEmployee?.rentalCarEligible && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Rental Car (Optional)</h3>
              <label className="block">Provider:</label>
              <input type="text" name="provider" value={formData.rentalCar.provider} onChange={(e) => handleChange(e, "rentalCar")} className="border p-2 rounded w-full mb-2" />
              <label className="block">Make & Model:</label>
            <input type="text" name="makeAndModel" value={formData.rentalCar.makeAndModel} onChange={(e) => handleChange(e, "rentalCar")} className="border p-2 rounded w-full mb-2" />

            <label className="block">License Plate:</label>
            <input type="text" name="licensePlate" value={formData.rentalCar.licensePlate} onChange={(e) => handleChange(e, "rentalCar")} className="border p-2 rounded w-full mb-2" />
            
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">Save</button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateTravelDetails;
