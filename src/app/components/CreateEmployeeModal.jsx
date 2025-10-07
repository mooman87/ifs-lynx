"use client";

import React from "react";

const CreateEmployeeModal = ({ isOpen, toggleModal, formData, handleChange, handleSubmit, isEditing = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 text-center">
          {isEditing ? "Edit Employee" : "Add New Employee"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {Object.keys(formData).map((field, idx) => (
              field !== "rentalCarEligible" && ( 
                <div key={idx} className="flex flex-col">
                  <label className="text-xs font-semibold text-gray-700 mb-1">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type={field === "dob" || field === "availableStart" ? "date" : "text"}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className="border p-2 rounded text-sm w-full"
                  />
                </div>
              )
            ))}
          </div>
          <div className="flex items-center mb-4">
          <input
  type="checkbox"
  id="rentalCarEligible"
  name="rentalCarEligible"
  checked={formData.rentalCarEligible || false}
  onChange={(e) => handleChange({ target: { name: "rentalCarEligible", value: e.target.checked } })}
  className="mr-2"
/>
            <label htmlFor="rentalCarEligible" className="text-sm text-gray-700">
              Eligible for Rental Car
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={toggleModal} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">
              Cancel
            </button>
            <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
              {isEditing ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployeeModal;
