import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "../context/DashboardContext";
import ProjectModal from "../components/ProjectModal";

const normalizeProject = (p) => {
  const assigned =
    p.assignedEmployees ??
    p.assigned_employees ??
    p.project_employees ??
    [];

  return {
    id: p.id ?? p._id,
    campaignName: p.campaign_name ?? p.campaignName ?? "",
    stateDirector: p.state_director ?? p.stateDirector ?? "",
    startDate: p.start_date ?? p.startDate ?? null,
    endDate: p.end_date ?? p.endDate ?? null,
    doorsRemaining: p.doors_remaining ?? p.doorsRemaining ?? 0,
    assignedCount: Array.isArray(assigned) ? assigned.length : 0,
  };
};

const roleRank = {
  Canvasser: 1,
  "Field Director": 2,
  "Deputy State Director": 3,
  "State Director": 4,
  "Political Director": 5,
  "C Suite": 6,
  HR: 6,
  Payroll: 6,
  Travel: 6,
  "Super Admin": 99,
  Demo: 0,
};

const canArchiveByRank = (user) => {
  if (!user?.role) return false;
  if (user.role === "Super Admin") return false; // Super Admin gets Delete, not Archive
  if (!user?.organization?.id) return false; // must belong to an org
  return (roleRank[user.role] ?? 0) >= (roleRank["State Director"] ?? 999);
};

const ActiveProjects = ({
  projects,
  setProjects,
  fetchProjects,
  errorMessage,
  paginateProjects,
  projectsPerPage,
  user, // ✅ IMPORTANT: pass this in from DashboardContext or parent
}) => {
  const router = useRouter();
  const { selectedPage } = useDashboard();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    campaignName: "",
    doorsRemaining: "",
    startDate: "",
    endDate: "",
    stateDirector: "",
  });

  const isSuperAdmin = user?.role === "Super Admin";
  const canArchive = canArchiveByRank(user);

  const goToProject = (projectId) => {
    router.push(`/project/${projectId}?selectedPage=${encodeURIComponent(selectedPage)}`);
  };

  const getProjectStatus = (startDate, endDate) => {
    const today = new Date();
    const projectStart = startDate ? new Date(startDate) : null;
    const projectEnd = endDate ? new Date(endDate) : null;

    if (projectStart && projectEnd && today >= projectStart && today <= projectEnd) {
      return {
        label: "Live",
        dotBgColor: "bg-emerald-500",
        textColor: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
      };
    } else if (projectStart && today < projectStart) {
      return {
        label: "Pending",
        dotBgColor: "bg-yellow-500",
        textColor: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
      };
    } else {
      return {
        label: "Complete",
        dotBgColor: "bg-red-500",
        textColor: "text-red-500",
        bgColor: "bg-red-500/10",
      };
    }
  };

  const archiveProject = async (projectId) => {
    const ok = window.confirm("Archive this project? It will disappear from Active Projects.");
    if (!ok) return;

    try {
      const res = await fetch("/api/project/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: projectId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to archive project");

      // remove from active list (since API should exclude archived)
      setProjects((prev) => prev.filter((p) => (p.id ?? p._id) !== projectId));
    } catch (err) {
      console.error(err);
      alert(err.message || "Archive failed");
    }
  };

  const deleteProject = async (projectId) => {
    const ok = window.confirm("Delete this project? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`/api/project?id=${encodeURIComponent(projectId)}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to delete project");

      setProjects((prev) => prev.filter((p) => (p.id ?? p._id) !== projectId));
    } catch (err) {
      console.error(err);
      alert(err.message || "Delete failed");
    }
  };

  const ActionButton = ({ projectId }) => {
    if (isSuperAdmin) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteProject(projectId);
          }}
          className="rounded bg-red-600 text-white px-3 py-2 text-sm font-semibold hover:bg-red-700"
        >
          Delete
        </button>
      );
    }

    if (canArchive) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            archiveProject(projectId);
          }}
          className="rounded bg-amber-600 text-white px-3 py-2 text-sm font-semibold hover:bg-amber-700"
        >
          Archive
        </button>
      );
    }

    return <span className="text-xs text-gray-400">—</span>;
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-2xl">Active Projects</span>
        <button
          onClick={() => setIsProjectModalOpen((v) => !v)}
          className="add-btn"
        >
          <span className="text-lg font-semibold">+ Add</span>
        </button>
      </div>

      <div className="justify-items-start">
        {errorMessage ? (
          <p>{errorMessage}</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto mt-10 hidden md:block">
              <table className="w-full bg-white border border-gray-300 shadow-lg rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Project</th>
                    <th className="py-3 px-6 text-left">State Director</th>
                    <th className="py-3 px-6 text-left">Assigned Staff</th>
                    <th className="py-3 px-6 text-left">Doors Remaining</th>
                    <th className="py-3 px-6 text-left">Status</th>
                    <th className="py-3 px-6 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {projects.map((raw) => {
                    const project = normalizeProject(raw);
                    const { label } = getProjectStatus(project.startDate, project.endDate);

                    return (
                      <tr
                        key={project.id}
                        onClick={() => goToProject(project.id)}
                        className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                      >
                        <td className="py-3 px-6 text-left">{project.campaignName}</td>
                        <td className="py-3 px-6 text-left">{project.stateDirector}</td>
                        <td className="py-3 px-6 text-left">{project.assignedCount}</td>
                        <td className="py-3 px-6 text-left">
                          {Number(project.doorsRemaining || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-6 text-left">{label}</td>

                        {/* ✅ button belongs INSIDE a td */}
                        <td className="py-3 px-6 text-left">
                          <ActionButton projectId={project.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mt-10 md:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((raw) => {
                  const project = normalizeProject(raw);
                  const status = getProjectStatus(project.startDate, project.endDate);

                  return (
                    <div
                      key={project.id}
                      onClick={() => goToProject(project.id)}
                      className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                          {project.campaignName}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.7rem] font-medium ${status.bgColor} ${status.textColor}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${status.dotBgColor}`} />
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-[0.65rem] uppercase tracking-wide text-gray-400">
                            State Director
                          </p>
                          <p className="mt-1 truncate">{project.stateDirector || "—"}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-[0.65rem] uppercase tracking-wide text-gray-400">
                            Assigned Staff
                          </p>
                          <p className="mt-1">{project.assignedCount}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-[0.65rem] uppercase tracking-wide text-gray-400">
                            Doors Remaining
                          </p>
                          <p className="mt-1">{Number(project.doorsRemaining || 0).toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-[0.65rem] uppercase tracking-wide text-gray-400">
                            Dates
                          </p>
                          <p className="mt-1">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"} –{" "}
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}
                          </p>
                        </div>
                      </div>

                      {/* ✅ mobile action */}
                      <div className="mt-2">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="w-full"
                        >
                          <ActionButton projectId={project.id} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {isProjectModalOpen && (
        <ProjectModal
          isOpen={isProjectModalOpen}
          toggleModal={() => setIsProjectModalOpen((v) => !v)}
          formData={projectFormData}
          handleChange={(e) =>
            setProjectFormData({ ...projectFormData, [e.target.name]: e.target.value })
          }
          handleSubmit={async (formData) => {
            const res = await fetch("/api/project", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(formData),
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              setIsProjectModalOpen(false);
              await fetchProjects(); // source of truth
            } else {
              console.error(data.message || "Create failed");
              alert(data.message || "Create failed");
            }
          }}
        />
      )}
    </div>
  );
};

export default ActiveProjects;
