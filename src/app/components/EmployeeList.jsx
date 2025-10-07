import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "../context/DashboardContext";
import CreateEmployeeModal from "./CreateEmployeeModal";

import "../../styles/employeeCard.css";

const EmployeeList = ({ employees, setEmployees, errorMessage, fetchEmployees }) => {
  const router = useRouter();
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState({
    firstName: '', lastName: '', gender: '',
    dob: '', phone: '', address: '',
    address2: '', city: '', state: '', 
    zip: '', email: '', availableStart: '', 
    role: '', reportsTo: '', homeAirport: '', 
    altAirport: '', rentalCarEligible: false,
  });

  const selectedPage = useDashboard();

  const handleEmployeeModalToggle = () => {
    setIsEmployeeModalOpen(!isEmployeeModalOpen);
  };

  const handleEmployeeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployeeFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const createEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeFormData)
      });
      const data = await res.json();
      if (res.ok) {
        setEmployees((prev) => [...prev, data.employee]);
        setIsEmployeeModalOpen(false);
        setEmployeeFormData({
          firstName: '', lastName: '', gender: '', dob: '', phone: '', address: '', address2: '', city: '',
          state: '', zip: '', email: '', availableStart: '', role: '', reportsTo: '', homeAirport: '', altAirport: '', rentalCarEligible: false,
        });
        fetchEmployees();
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const goToEmployeeProfile = (employeeId) => {
    router.push(`/employee/${employeeId}?selectedPage=${encodeURIComponent(selectedPage)}`);
  };

  const groupedEmployees = employees.reduce((acc, employee) => {
    const role = employee.role || "Unassigned";
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(employee);
    return acc;
  }, {});

  return (
    <>
      <div>
        <div className="flex items-center mb-5 gap-2">
          <span className="font-bold text-2xl">Employee Profiles</span>
          <button onClick={handleEmployeeModalToggle} className="add-btn">
            <span className="text-lg font-semibold">+ Add</span>
          </button>
        </div>
        {errorMessage && <p className="text-gray-600">{errorMessage}</p>}
        {Object.keys(groupedEmployees).sort().map((role) => (
          <div key={role} className="mb-8">
            <h2 className="text-xl font-bold mb-4">{role}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {groupedEmployees[role].map((employee) => (
                <div 
                  key={employee._id} 
                  className="card-client p-4 border rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                  onClick={() => goToEmployeeProfile(employee._id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="user-picture flex-shrink-0 bg-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="svg-icon">
                        <path d="M224 256c70.7 0 128-57.31 128-128s-57.3-128-128-128C153.3 0 96 57.31 96 128S153.3 256 224 256zM274.7 304H173.3C77.61 304 0 381.6 0 477.3c0 19.14 15.52 34.67 34.66 34.67h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304z" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <p className="text-lg font-semibold">{employee.firstName} {employee.lastName}</p>
                      <p className="text-sm">{employee.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {isEmployeeModalOpen && (
          <CreateEmployeeModal 
            isOpen={isEmployeeModalOpen}
            toggleModal={handleEmployeeModalToggle}
            formData={employeeFormData}
            handleChange={handleEmployeeChange}
            handleSubmit={createEmployee}
          />
        )}
      </div>
    </>
  );
};

export default EmployeeList;
