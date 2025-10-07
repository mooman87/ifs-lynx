import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "../context/DashboardContext";
import ProjectModal from "../components/ProjectModal";

const ActiveProjects = ({ projects, setProjects, fetchProjects, errorMessage, paginateProjects, projectsPerPage }) => {
  const router = useRouter();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    campaignName: '', doorsRemaining: '', startDate: '', endDate: '', stateDirector: ''
  });

  const { selectedPage } = useDashboard();

  const handleProjectModalToggle = () => {
    setIsProjectModalOpen(!isProjectModalOpen);
  };

  const handleProjectChange = (e) => {
    setProjectFormData({ ...projectFormData, [e.target.name]: e.target.value });
  };

  const goToProject = (projectId) => {
    router.push(`/project/${projectId}?selectedPage=${encodeURIComponent(selectedPage)}`);
  };

  const createProject = async (formData) => {
    try {
      const res = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setProjects((prev) => [...prev, data.project]);
        setIsProjectModalOpen(false);
        setProjectFormData({
          campaignName: '', startDate: '', endDate: '', doorsRemaining: '', stateDirector: ''
        });
        await fetchProjects();
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getProjectStatus = (startDate, endDate) => {
    const today = new Date();
    const projectStart = new Date(startDate);
    const projectEnd = new Date(endDate);
    if (today >= projectStart && today <= projectEnd) {
      return { label: "Live", dotBgColor: "bg-emerald-500", textColor: "text-emerald-500", bgColor: "bg-emerald-500/10" };
    } else if (today < projectStart) {
      return { label: "Pending", dotBgColor: "bg-yellow-500", textColor: "text-yellow-500", bgColor: "bg-yellow-500/10" };
    } else {
      return { label: "Complete", dotBgColor: "bg-red-500", textColor: "text-red-500", bgColor: "bg-red-500/10" };
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-2xl">Active Projects</span>
        <button onClick={handleProjectModalToggle} className="add-btn">
          <span className="text-lg font-semibold">+ Add</span>
        </button>
      </div>
      <div className="justify-items-start">
        {errorMessage ? (
          <p>{errorMessage}</p>
        ) : (
          <div className="overflow-x-auto mt-10">
            <table className="w-full bg-white border border-gray-300 shadow-lg rounded-lg">
              <thead>
                <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Project</th>
                  <th className="py-3 px-6 text-left">State Director</th>
                  <th className="py-3 px-6 text-left">Assigned Staff</th>
                  <th className="py-3 px-6 text-left">Doors Remaining</th>
                  <th className="py-3 px-6 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {projects.map((project) => {
                  const { label } = getProjectStatus(project.startDate, project.endDate);
                  return (
                    <tr
                      key={project._id}
                      onClick={() => goToProject(project._id)}
                      className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                    >
                      <td className="py-3 px-6 text-left">{project?.campaignName}</td>
                      <td className="py-3 px-6 text-left">{project?.stateDirector}</td>
                      <td className="py-3 px-6 text-left">{project?.assignedEmployees.length}</td>
                      <td className="py-3 px-6 text-left">{project?.doorsRemaining.toLocaleString()}</td>
                      <td className="py-3 px-6 text-left">{label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {isProjectModalOpen && (
        <ProjectModal 
          isOpen={isProjectModalOpen}
          toggleModal={handleProjectModalToggle}
          formData={projectFormData}
          handleChange={handleProjectChange}
          handleSubmit={createProject}
        />
      )}
    </div>
  );
};

export default ActiveProjects;
