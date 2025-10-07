"use client";

import React, { useState, useEffect } from "react";

const ProjectModal = ({ isOpen, toggleModal, formData, handleSubmit, isEditing = false }) => {
  const [localFormData, setLocalFormData] = useState(formData);

  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  const handleEditChange = (e, section = null, field = null) => {
    const { name, value } = e.target;

    if (section) {
      setLocalFormData((prevData) => ({
        ...prevData,
        [section]: {
          ...prevData[section],
          [field]: value,
        },
      }));
    } else {
      setLocalFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(localFormData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">{isEditing ? "Edit Project" : "Add Project"}</h2>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* 🔹 General Project Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(formData).map((field, idx) =>
              typeof formData[field] === "object" ? null : (
                <input
                  key={idx}
                  type="text"
                  name={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={localFormData[field] || ""}
                  onChange={handleEditChange}
                  className="border p-2 rounded w-full"
                />
              )
            )}
          </div>

          {/* 🔹 Manager Hotel Section */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Manager Hotel</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Hotel Name"
                value={localFormData.managerHotel?.name || ""}
                onChange={(e) => handleEditChange(e, "managerHotel", "name")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Address"
                value={localFormData.managerHotel?.address || ""}
                onChange={(e) => handleEditChange(e, "managerHotel", "address")}
                className="border p-2 rounded w-full"
              />
              <input
                type="date"
                placeholder="Check-in Date"
                value={localFormData.managerHotel?.checkInDate || ""}
                onChange={(e) => handleEditChange(e, "managerHotel", "checkInDate")}
                className="border p-2 rounded w-full"
              />
              <input
                type="date"
                placeholder="Check-out Date"
                value={localFormData.managerHotel?.checkOutDate || ""}
                onChange={(e) => handleEditChange(e, "managerHotel", "checkOutDate")}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>

          {/* 🔹 Staff Hotel Section */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Staff Hotel</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Hotel Name"
                value={localFormData.staffHotel?.name || ""}
                onChange={(e) => handleEditChange(e, "staffHotel", "name")}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Address"
                value={localFormData.staffHotel?.address || ""}
                onChange={(e) => handleEditChange(e, "staffHotel", "address")}
                className="border p-2 rounded w-full"
              />
              <input
                type="date"
                placeholder="Check-in Date"
                value={localFormData.staffHotel?.checkInDate || ""}
                onChange={(e) => handleEditChange(e, "staffHotel", "checkInDate")}
                className="border p-2 rounded w-full"
              />
              <input
                type="date"
                placeholder="Check-out Date"
                value={localFormData.staffHotel?.checkOutDate || ""}
                onChange={(e) => handleEditChange(e, "staffHotel", "checkOutDate")}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={toggleModal} className="px-4 py-2 bg-gray-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
              {isEditing ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
