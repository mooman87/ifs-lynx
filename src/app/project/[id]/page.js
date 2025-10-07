import dbConnect from "@/utils/dbConnect";
import Project from "@/models/Project";
import ProjectClient from "./ProjectClient";

export default async function ProjectPage({ params }) {
 
  await dbConnect();


  const projectDoc = await Project.findById(params.id)
    .populate("assignedEmployees")
    .lean();

  if (!projectDoc) {
    return <div className="p-6">Project not found.</div>;
  }

  const projectData = JSON.parse(JSON.stringify(projectDoc));

  return <ProjectClient initialProject={projectData} />;
}
