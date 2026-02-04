// src/app/api/employee/[id]/route.js
import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

function expandDateKeys(obj) {
  const base = obj && typeof obj === "object" ? obj : {};
  const out = { ...base };
  for (const [k, v] of Object.entries(base)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
      const dt = new Date(`${k}T00:00:00Z`);
      if (!Number.isNaN(dt.getTime())) {
        const dateString = dt.toDateString();
        if (out[dateString] === undefined) out[dateString] = v;
      }
    } else {
      const dt = new Date(k);
      if (!Number.isNaN(dt.getTime())) {
        const ymd = dt.toISOString().slice(0, 10);
        const dateString = dt.toDateString();
        if (out[ymd] === undefined) out[ymd] = v;
        if (out[dateString] === undefined) out[dateString] = v;
      }
    }
  }
  return out;
}

function toMongoishEmployee(e) {
  return {
    _id: e.id,
    id: e.id,
    organization: e.organization_id,

    firstName: e.first_name ?? "",
    lastName: e.last_name ?? "",
    gender: e.gender ?? null,
    dob: e.dob ?? null,
    phone: e.phone ?? null,
    address: e.address ?? null,
    address2: e.address2 ?? null,
    city: e.city ?? null,
    state: e.state ?? null,
    zip: e.zip ?? null,
    email: e.email ?? null,

    availableStart: e.available_start ?? null,
    role: e.role ?? null,
    reportsTo: e.reports_to ?? null,

    homeAirport: e.home_airport ?? null,
    altAirport: e.alt_airport ?? null,

    doorsKnocked: e.doors_knocked ?? 0,
    doorsKnockedPerDay: expandDateKeys(e.doors_knocked_per_day),
    contactsMadePerDay: expandDateKeys(e.contacts_made_per_day),

    rentalCarEligible: e.rental_car_eligible ?? true,

    assignedProjects: (e.project_employees || []).map((pe) => ({
      _id: pe.project?.id,
      id: pe.project?.id,
      campaignName: pe.project?.campaign_name,
      startDate: pe.project?.start_date,
      endDate: pe.project?.end_date,
    })).filter(p => p.id),
  };
}

const EMPLOYEE_BY_PK = `
query EmployeeByPk($id: uuid!) {
  employees_by_pk(id: $id) {
    id
    organization_id
    first_name
    last_name
    gender
    dob
    phone
    address
    address2
    city
    state
    zip
    email
    available_start
    role
    reports_to
    home_airport
    alt_airport
    doors_knocked
    doors_knocked_per_day
    contacts_made_per_day
    rental_car_eligible

    project_employees {
      project {
        id
        campaign_name
        start_date
        end_date
      }
    }
  }
}
`;

const UPDATE_EMPLOYEE = `
mutation UpdateEmployee($id: uuid!, $set: employees_set_input!) {
  update_employees_by_pk(pk_columns: {id: $id}, _set: $set) { id }
}
`;

export const GET = withUser(async (_request, user, ctx) => {
  try {
    const { id } = await ctx.params;

    const data = await hasuraFetch(EMPLOYEE_BY_PK, { id }, { admin: true });
    const e = data.employees_by_pk;
    if (!e) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const isSuperAdmin = user.role === "Super Admin";
    if (!isSuperAdmin && user.organization?.id !== e.organization_id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ employee: toMongoishEmployee(e) }, { status: 200 });
  } catch (err) {
    console.error("GET /api/employee/[id] error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
});

export const PUT = withUser(async (request, user, ctx) => {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    // enforce org gate
    const existing = await hasuraFetch(EMPLOYEE_BY_PK, { id }, { admin: true });
    const e = existing.employees_by_pk;
    if (!e) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const isSuperAdmin = user.role === "Super Admin";
    if (!isSuperAdmin && user.organization?.id !== e.organization_id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const set = {
      first_name: body.firstName ?? undefined,
      last_name: body.lastName ?? undefined,
      gender: body.gender ?? undefined,
      dob: body.dob ?? undefined,
      phone: body.phone ?? undefined,
      address: body.address ?? undefined,
      address2: body.address2 ?? undefined,
      city: body.city ?? undefined,
      state: body.state ?? undefined,
      zip: body.zip ?? undefined,
      email: body.email ?? undefined,
      available_start: body.availableStart ?? undefined,
      role: body.role ?? undefined,
      reports_to: body.reportsTo ?? undefined,
      home_airport: body.homeAirport ?? undefined,
      alt_airport: body.altAirport ?? undefined,
      doors_knocked: body.doorsKnocked ?? undefined,
      doors_knocked_per_day: body.doorsKnockedPerDay ?? undefined,
      contacts_made_per_day: body.contactsMadePerDay ?? undefined,
      rental_car_eligible: body.rentalCarEligible ?? undefined,
    };

    Object.keys(set).forEach((k) => set[k] === undefined && delete set[k]);

    await hasuraFetch(UPDATE_EMPLOYEE, { id, set }, { admin: true });

    const refreshed = await hasuraFetch(EMPLOYEE_BY_PK, { id }, { admin: true });
    return NextResponse.json({ employee: toMongoishEmployee(refreshed.employees_by_pk) }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/employee/[id] error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
});
