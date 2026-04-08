import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "../context/DashboardContext";
import ProjectModal from "../components/ProjectModal";

const normalizeProject = (p) => {
  const assigned =
    p.assignedEmployees ?? p.assigned_employees ?? p.project_employees ?? [];

  return {
    id: p.id ?? p._id,
    campaignName: p.campaign_name ?? p.campaignName ?? "",
    stateDirector: p.state_director ?? p.stateDirector ?? "",
    startDate: p.start_date ?? p.startDate ?? null,
    endDate: p.end_date ?? p.endDate ?? null,
    doorsRemaining: p.doors_remaining ?? p.doorsRemaining ?? 0,
    doorsTarget: p.doors_target ?? p.doorsTarget ?? 0,
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
  if (user.role === "Super Admin") return false;
  if (!user?.organization?.id) return false;
  return (roleRank[user.role] ?? 0) >= (roleRank["State Director"] ?? 999);
};

const getProjectStatus = (startDate, endDate) => {
  const today = new Date();
  const projectStart = startDate ? new Date(startDate) : null;
  const projectEnd = endDate ? new Date(endDate) : null;

  if (
    projectStart &&
    projectEnd &&
    today >= projectStart &&
    today <= projectEnd
  ) {
    return "Live";
  } else if (projectStart && today < projectStart) {
    return "Pending";
  } else {
    return "Complete";
  }
};

// Returns initials from a full name string
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Progress bar fill: higher doors remaining = less progress made
const getProgressPercent = (doorsRemaining, doorsTarget) => {
  if (!doorsTarget || doorsTarget === 0) return 0;
  const knocked = doorsTarget - doorsRemaining;
  return Math.min(100, Math.max(0, Math.round((knocked / doorsTarget) * 100)));
};

const StatusBadge = ({ status }) => {
  const styles = {
    Live: "bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC]",
    Pending: "bg-[#FAEEDA] text-[#633806] border border-[#EF9F27]",
    Complete: "bg-[#F1EFE8] text-[#5F5E5A] border border-[#D3D1C7]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.Complete}`}
    >
      {status}
    </span>
  );
};

const DirectorAvatar = ({ name }) => (
  <div className="w-[18px] h-[18px] rounded-full bg-[#CECBF6] text-[#3C3489] text-[9px] font-medium flex items-center justify-center flex-shrink-0">
    {getInitials(name)}
  </div>
);

const ProgressBar = ({ doorsRemaining, doorsTarget, status }) => {
  const pct = getProgressPercent(doorsRemaining, doorsTarget);
  const fillColor =
    status === "Complete"
      ? "bg-[#B4B2A9]"
      : pct < 20
        ? "bg-[#EF9F27]"
        : "bg-[#7F77DD]";

  return (
    <div className="w-full">
      <div className="text-[13px] font-medium text-gray-900 mb-1 leading-none">
        {Number(doorsRemaining || 0).toLocaleString()}
      </div>
      <div className="h-[4px] rounded-full bg-gray-100 overflow-hidden w-full">
        <div
          className={`h-full rounded-full ${fillColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const ActiveProjects = ({
  projects,
  setProjects,
  fetchProjects,
  errorMessage,
  paginateProjects,
  projectsPerPage,
  user,
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
    router.push(
      `/project/${projectId}?selectedPage=${encodeURIComponent(selectedPage)}`,
    );
  };

  const archiveProject = async (projectId) => {
    const ok = window.confirm(
      "Archive this project? It will disappear from Active Projects.",
    );
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
      const res = await fetch(
        `/api/project?id=${encodeURIComponent(projectId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to delete project");
      setProjects((prev) => prev.filter((p) => (p.id ?? p._id) !== projectId));
    } catch (err) {
      console.error(err);
      alert(err.message || "Delete failed");
    }
  };
  //fix this
  const ActionMenu = ({ projectId }) => {
    const [open, setOpen] = useState(false);

    if (!isSuperAdmin && !canArchive) {
      return <span className="text-xs text-gray-300">—</span>;
    }

    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-md border border-transparent hover:border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          ···
        </button>
        {open && (
          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-sm min-w-[140px] z-10 overflow-hidden">
            <button
              onClick={() => {
                setOpen(false);
                goToProject(projectId);
              }}
              className="w-full text-left px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span>↗</span> View details
            </button>
            {canArchive && (
              <button
                onClick={() => {
                  setOpen(false);
                  archiveProject(projectId);
                }}
                className="w-full text-left px-3.5 py-2 text-[13px] text-amber-700 hover:bg-amber-50 flex items-center gap-2"
              >
                <span>⊘</span> Archive
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setOpen(false);
                  deleteProject(projectId);
                }}
                className="w-full text-left px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <span>✕</span> Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
  // ^ fix this

  // Split projects into Live/Pending and Complete
  const { activeList, completeList } = useMemo(() => {
    const normalized = (projects || []).map(normalizeProject);
    return {
      activeList: normalized.filter(
        (p) => getProjectStatus(p.startDate, p.endDate) !== "Complete",
      ),
      completeList: normalized.filter(
        (p) => getProjectStatus(p.startDate, p.endDate) === "Complete",
      ),
    };
  }, [projects]);

  const liveCount = activeList.filter(
    (p) => getProjectStatus(p.startDate, p.endDate) === "Live",
  ).length;
  const completeCount = completeList.length;

  const ProjectCard = ({ project }) => {
    const status = getProjectStatus(project.startDate, project.endDate);
    const isComplete = status === "Complete";

    return (
      <div
        onClick={() => goToProject(project.id)}
        className={`
          bg-white border border-[#AFA9EC] border-l-[3px] border-l-[#7F77DD] rounded-xl
          px-5 py-4 flex items-center gap-5 cursor-pointer
          hover:border-[#7F77DD] hover:border-l-[#534AB7] transition-colors
          ${isComplete ? "opacity-60 border-l-[#B4B2A9] border-[#E5E3E0]" : ""}
        `}
        style={
          isComplete
            ? { borderLeftColor: "#B4B2A9", borderColor: "#E5E3E0" }
            : {}
        }
      >
        {/* Name + director */}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-gray-900 truncate mb-1">
            {project.campaignName}
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <DirectorAvatar name={project.stateDirector} />
            {project.stateDirector || "—"}
          </div>
        </div>

        {/* Doors remaining */}
        <div className="min-w-[130px]">
          <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
            Doors remaining
          </div>
          <ProgressBar
            doorsRemaining={project.doorsRemaining}
            doorsTarget={project.doorsTarget}
            status={status}
          />
        </div>

        {/* Divider */}
        <div className="w-px h-9 bg-gray-100 flex-shrink-0" />

        {/* Staff */}
        <div className="min-w-[48px] text-right">
          <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
            Staff
          </div>
          <div
            className={`text-[15px] font-medium ${project.assignedCount === 0 ? "text-gray-300" : "text-gray-900"}`}
          >
            {project.assignedCount}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-9 bg-gray-100 flex-shrink-0" />

        {/* Status badge */}
        <StatusBadge status={status} />

        {/* Action menu */}
        <ActionMenu projectId={project.id} />
      </div>
    );
  };

  // Mobile card — same data, stacked layout
  const ProjectCardMobile = ({ project }) => {
    const status = getProjectStatus(project.startDate, project.endDate);
    const isComplete = status === "Complete";

    return (
      <div
        onClick={() => goToProject(project.id)}
        className={`
          bg-white border border-[#AFA9EC] border-l-[3px] border-l-[#7F77DD] rounded-xl p-4
          flex flex-col gap-3 cursor-pointer transition-colors
          ${isComplete ? "opacity-60" : ""}
        `}
        style={
          isComplete
            ? { borderLeftColor: "#B4B2A9", borderColor: "#E5E3E0" }
            : {}
        }
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[14px] font-medium text-gray-900 leading-snug line-clamp-2 flex-1">
            {project.campaignName}
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
          <DirectorAvatar name={project.stateDirector} />
          {project.stateDirector || "—"}
        </div>

        <div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1.5">
            Doors remaining
          </div>
          <ProgressBar
            doorsRemaining={project.doorsRemaining}
            doorsTarget={project.doorsTarget}
            status={status}
          />
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <div className="text-[12px] text-gray-500">
            <span className="text-gray-400">Staff: </span>
            <span className="font-medium text-gray-700">
              {project.assignedCount}
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <ActionMenu projectId={project.id} />
          </div>
        </div>
      </div>
    );
  };

  const SectionLabel = ({ children }) => (
    <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-2">
      {children}
    </div>
  );

  return (
    <div className="px-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[18px] font-medium text-gray-900">
            Active Projects
          </h1>
          <span className="text-[12px] text-[#534AB7] bg-[#EEEDFE] border border-[#AFA9EC] px-2.5 py-0.5 rounded-full">
            {liveCount} live
            {completeCount > 0 ? ` · ${completeCount} complete` : ""}
          </span>
        </div>
        <button
          onClick={() => setIsProjectModalOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
        >
          + New project
        </button>
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-500">{errorMessage}</p>
      ) : (
        <>
          {/* ── Desktop ── */}
          <div className="hidden md:block space-y-6">
            {activeList.length > 0 && (
              <div>
                <SectionLabel>Live</SectionLabel>
                <div className="space-y-2">
                  {activeList.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}

            {completeList.length > 0 && (
              <div>
                <SectionLabel>Complete</SectionLabel>
                <div className="space-y-2">
                  {completeList.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}

            {activeList.length === 0 && completeList.length === 0 && (
              <div className="text-center py-16 text-[13px] text-gray-400">
                No projects yet. Create your first project to get started.
              </div>
            )}
          </div>

          {/* ── Mobile ── */}
          <div className="md:hidden space-y-6">
            {activeList.length > 0 && (
              <div>
                <SectionLabel>Live</SectionLabel>
                <div className="space-y-3">
                  {activeList.map((project) => (
                    <ProjectCardMobile key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}

            {completeList.length > 0 && (
              <div>
                <SectionLabel>Complete</SectionLabel>
                <div className="space-y-3">
                  {completeList.map((project) => (
                    <ProjectCardMobile key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}

            {activeList.length === 0 && completeList.length === 0 && (
              <div className="text-center py-12 text-[13px] text-gray-400">
                No projects yet.
              </div>
            )}
          </div>
        </>
      )}

      {isProjectModalOpen && (
        <ProjectModal
          isOpen={isProjectModalOpen}
          toggleModal={() => setIsProjectModalOpen((v) => !v)}
          formData={projectFormData}
          handleChange={(e) =>
            setProjectFormData({
              ...projectFormData,
              [e.target.name]: e.target.value,
            })
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
              await fetchProjects();
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
