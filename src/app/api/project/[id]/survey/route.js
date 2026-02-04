// app/api/project/[id]/survey/route.js
import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const PROJECT_SURVEY = `
query ProjectSurvey($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    survey
  }
}
`;

const UPDATE_PROJECT_SURVEY = `
mutation UpdateSurvey($id: uuid!, $survey: jsonb!) {
  update_projects_by_pk(pk_columns: { id: $id }, _set: { survey: $survey }) {
    id
    survey
  }
}
`;

export const GET = withUser(async (_request, user, { params }) => {
  try {
    const { id } = params;

    const data = await hasuraFetch(PROJECT_SURVEY, { id }, { admin: true });
    const project = data.projects_by_pk;

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const isSuperAdmin = user.role === "Super Admin";
    if (!isSuperAdmin && user.organization?.id !== project.organization_id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ survey: project.survey || {} }, { status: 200 });
  } catch (error) {
    console.error("Error fetching survey:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
});

export const PUT = withUser(async (request, user, { params }) => {
  try {
    const { id } = params;
    const { survey } = await request.json();

    if (!survey) {
      return NextResponse.json({ message: "No survey data provided" }, { status: 400 });
    }

    const existing = await hasuraFetch(PROJECT_SURVEY, { id }, { admin: true });
    const project = existing.projects_by_pk;

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const isSuperAdmin = user.role === "Super Admin";
    if (!isSuperAdmin && user.organization?.id !== project.organization_id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await hasuraFetch(UPDATE_PROJECT_SURVEY, { id, survey }, { admin: true });
    return NextResponse.json(
      { message: "Survey updated successfully", survey: updated.update_projects_by_pk.survey || {} },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating survey:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
});
