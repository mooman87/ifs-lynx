// app/api/project/[id]/apply-knocked-doors/route.js
import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

/**
 * NOTE:
 * This preserves your existing input shape:
 *   { selectedDate, matchedData: [{ matchedEmployee, doorsKnocked, contactsMade }, ...] }
 *
 * It matches employees by "First Last" from the project's assigned employees.
 * If you later change matchedData to include employeeId directly, this route gets even simpler.
 */

const PROJECT_WITH_ASSIGNED_EMPLOYEES = `
query ProjectWithAssigned($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    doors_remaining
    total_doors_knocked
    project_employees {
      employee {
        id
        first_name
        last_name
        doors_knocked_per_day
        contacts_made_per_day
      }
    }
  }
}
`;

const UPDATE_EMPLOYEE_DAY_MAPS = `
mutation UpdateEmployeeMaps($id: uuid!, $doorsMap: jsonb!, $contactsMap: jsonb!) {
  update_employees_by_pk(
    pk_columns: { id: $id }
    _set: {
      doors_knocked_per_day: $doorsMap
      contacts_made_per_day: $contactsMap
    }
  ) {
    id
  }
}
`;

const UPDATE_PROJECT_TOTALS = `
mutation UpdateProjectTotals($id: uuid!, $totalDoors: Int!, $doorsRemaining: Int!) {
  update_projects_by_pk(
    pk_columns: { id: $id }
    _set: {
      total_doors_knocked: $totalDoors
      doors_remaining: $doorsRemaining
    }
  ) {
    id
  }
}
`;

const EMPLOYEES_BY_PROJECT = `
query EmployeesByProject($projectId: uuid!) {
  project_employees(where: { project_id: { _eq: $projectId } }) {
    employee {
      id
      first_name
      last_name
      email
      doors_knocked_per_day
      contacts_made_per_day
    }
  }
}
`;

const PROJECT_REFRESH = `
query ProjectRefresh($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    campaign_name
    start_date
    end_date
    door_count
    doors_remaining
    total_doors_knocked
    daily_staff_needed
    state_director
    manager_hotel
    staff_hotel
    survey

    project_employees {
      employee {
        id
        first_name
        last_name
        email
      }
    }

    project_schedule(order_by: { work_date: asc }) {
      work_date
      project_schedule_employees {
        employee {
          id
          first_name
          last_name
          email
        }
      }
    }
  }
}
`;

function toMongoishProject(p) {
  const assignedEmployees =
    (p.project_employees || [])
      .map((pe) => pe.employee)
      .filter(Boolean)
      .map((e) => ({
        _id: e.id,
        id: e.id,
        firstName: e.first_name,
        lastName: e.last_name,
        email: e.email,
      }));

  const schedule =
    (p.project_schedule || []).map((s) => ({
      date: s.work_date,
      employees: (s.project_schedule_employees || [])
        .map((se) => se.employee)
        .filter(Boolean)
        .map((e) => ({
          _id: e.id,
          id: e.id,
          firstName: e.first_name,
          lastName: e.last_name,
          email: e.email,
        })),
    }));

  return {
    _id: p.id,
    id: p.id,
    organization: p.organization_id,

    campaignName: p.campaign_name,
    startDate: p.start_date,
    endDate: p.end_date,
    doorCount: p.door_count,
    doorsRemaining: p.doors_remaining,
    totalDoorsKnocked: p.total_doors_knocked,
    dailyStaffNeeded: p.daily_staff_needed || {},
    stateDirector: p.state_director,
    managerHotel: p.manager_hotel || null,
    staffHotel: p.staff_hotel || null,
    survey: p.survey || {},

    assignedEmployees,
    schedule,
  };
}

export const PUT = withUser(async (request, user, { params }) => {
  try {
    const{ projectId } = params;
    const { selectedDate, matchedData } = await request.json();

    if (!selectedDate || !matchedData || !Array.isArray(matchedData) || matchedData.length === 0) {
      return NextResponse.json({ message: "Invalid request data" }, { status: 400 });
    }

    const base = await hasuraFetch(PROJECT_WITH_ASSIGNED_EMPLOYEES, { id: projectId }, { admin: true });
    const project = base.projects_by_pk;

    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

    const isSuperAdmin = user.role === "Super Admin";
    if (!isSuperAdmin && user.organization?.id !== project.organization_id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const assignedEmployees = (project.project_employees || [])
      .map((pe) => pe.employee)
      .filter(Boolean);

    const dateKey = String(selectedDate); 

    let totalDoorsAdded = 0;
    let totalContactsAdded = 0;


    const asObj = (v) => (v && typeof v === "object" ? v : {});

    for (const entry of matchedData) {
      const fullName = entry.matchedEmployee;
      if (!fullName) continue;

      const matchedEmployee = assignedEmployees.find(
        (e) => `${e.first_name} ${e.last_name}` === fullName
      );

      if (!matchedEmployee) continue;

      const newDoors = Number(entry.doorsKnocked ?? 0);
      const newContacts = Number(entry.contactsMade ?? 0);

      const doorsMap = asObj(matchedEmployee.doors_knocked_per_day);
      const contactsMap = asObj(matchedEmployee.contacts_made_per_day);

      const existingDoors = Number(doorsMap[dateKey] ?? 0);
      const existingContacts = Number(contactsMap[dateKey] ?? 0);

      // Only increase if new values exceed existing
      if (newDoors > existingDoors) {
        doorsMap[dateKey] = newDoors;
        totalDoorsAdded += (newDoors - existingDoors);
      }

      if (newContacts > existingContacts) {
        contactsMap[dateKey] = newContacts;
        totalContactsAdded += (newContacts - existingContacts);
      }

      // Persist employee updates if anything changed
      const doorsChanged = newDoors > existingDoors;
      const contactsChanged = newContacts > existingContacts;

      if (doorsChanged || contactsChanged) {
        await hasuraFetch(
          UPDATE_EMPLOYEE_DAY_MAPS,
          {
            id: matchedEmployee.id,
            doorsMap,
            contactsMap,
          },
          { admin: true }
        );
      }
    }

    const currentTotal = Number(project.total_doors_knocked ?? 0);
    const currentRemaining = Number(project.doors_remaining ?? 0);

    const updatedTotal = currentTotal + totalDoorsAdded;
    const updatedRemaining = Math.max(0, currentRemaining - totalDoorsAdded);

    await hasuraFetch(
      UPDATE_PROJECT_TOTALS,
      { id: projectId, totalDoors: updatedTotal, doorsRemaining: updatedRemaining },
      { admin: true }
    );

    const refreshed = await hasuraFetch(PROJECT_REFRESH, { id: projectId }, { admin: true });
    const refreshedProject = refreshed.projects_by_pk;

    const empRes = await hasuraFetch(EMPLOYEES_BY_PROJECT, { projectId }, { admin: true });
    const employees = (empRes.project_employees || [])
      .map((pe) => pe.employee)
      .filter(Boolean)
      .map((e) => ({
        _id: e.id,
        id: e.id,
        firstName: e.first_name,
        lastName: e.last_name,
        email: e.email,
        doorsKnockedPerDay: e.doors_knocked_per_day || {},
        contactsMadePerDay: e.contacts_made_per_day || {},
      }));

    return NextResponse.json(
      {
        message: "Doors & contacts applied successfully",
        project: toMongoishProject(refreshedProject),
        assignedEmployees: employees,
        totals: { totalDoorsAdded, totalContactsAdded },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error applying knocked doors:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
});
