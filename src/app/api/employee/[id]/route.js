//api/employee/[id]/route.js
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

function toStaffRecord(s) {
  if (!s) return null;

  return {
    _id: s.id,
    id: s.id,
    organization: s.organization_id,

    userId: s.user_id ?? s.user_legacy_id ?? null,
    canLogin: s.can_login ?? true,
    staffType: s.staff_type ?? "employee",
    isActive: s.is_active ?? true,

    email: s.email ?? null,
    username: s.username ?? null,
    fullName:
      s.full_name || [s.first_name, s.last_name].filter(Boolean).join(" "),
    role: s.org_role ?? null,

    firstName: s.first_name ?? "",
    lastName: s.last_name ?? "",
    gender: s.gender ?? null,
    dob: s.dob ?? null,
    phone: s.phone ?? null,
    address: s.address ?? null,
    address2: s.address2 ?? null,
    city: s.city ?? null,
    state: s.state ?? null,
    zip: s.zip ?? null,

    availableStart: s.available_start ?? null,
    reportsTo: s.reports_to ?? null,
    homeAirport: s.home_airport ?? null,
    altAirport: s.alt_airport ?? null,

    doorsKnocked: s.doors_knocked ?? 0,
    doorsKnockedPerDay: expandDateKeys(s.doors_knocked_per_day),
    contactsMadePerDay: expandDateKeys(s.contacts_made_per_day),

    rentalCarEligible: s.rental_car_eligible ?? true,

    assignedProjects: (s.project_staff || [])
      .map((ps) => ({
        _id: ps.project?.id,
        id: ps.project?.id,
        campaignName: ps.project?.campaign_name,
        startDate: ps.project?.start_date,
        endDate: ps.project?.end_date,
      }))
      .filter((p) => p.id),

    createdAt: s.created_at ?? null,
    updatedAt: s.updated_at ?? null,
    lastLoginAt: s.last_login_at ?? null,
  };
}

const STAFF_BY_PK = `
query StaffById($id: uuid!) {
  staff_by_pk(id: $id) {
    id
    organization_id
    user_id
    user_legacy_id
    can_login
    staff_type
    is_active
    email
    username
    password_hash
    full_name
    org_role

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
    available_start
    reports_to
    home_airport
    alt_airport

    doors_knocked
    doors_knocked_per_day
    contacts_made_per_day
    rental_car_eligible

    created_at
    updated_at
    last_login_at

    project_staff {
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

const UPDATE_STAFF = `
mutation UpdateStaff($id: uuid!, $set: staff_set_input!) {
  update_staff_by_pk(pk_columns: { id: $id }, _set: $set) {
    id
    organization_id
    user_id
    user_legacy_id
    can_login
    staff_type
    is_active
    email
    username
    full_name
    org_role

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
    available_start
    reports_to
    home_airport
    alt_airport

    doors_knocked
    doors_knocked_per_day
    contacts_made_per_day
    rental_car_eligible

    created_at
    updated_at
    last_login_at

    project_staff {
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

function buildUpdateSet(body) {
  const set = {
    email: body.email ?? undefined,
    username: body.username ?? undefined,
    full_name: body.fullName ?? undefined,
    org_role: body.role ?? undefined,

    first_name: body.firstName ?? body.first_name ?? undefined,
    last_name: body.lastName ?? body.last_name ?? undefined,
    gender: body.gender ?? undefined,
    dob: body.dob ?? undefined,
    phone: body.phone ?? undefined,
    address: body.address ?? undefined,
    address2: body.address2 ?? undefined,
    city: body.city ?? undefined,
    state: body.state ?? undefined,
    zip: body.zip ?? undefined,
    available_start: body.availableStart ?? undefined,
    reports_to: body.reportsTo ?? undefined,
    home_airport: body.homeAirport ?? undefined,
    alt_airport: body.altAirport ?? undefined,

    can_login: body.canLogin ?? undefined,
    staff_type: body.staffType ?? undefined,
    is_active: body.isActive ?? undefined,
    rental_car_eligible: body.rentalCarEligible ?? undefined,

    doors_knocked: body.doorsKnocked ?? undefined,
    doors_knocked_per_day: body.doorsKnockedPerDay ?? undefined,
    contacts_made_per_day: body.contactsMadePerDay ?? undefined,
  };

  Object.keys(set).forEach((k) => {
    if (set[k] === undefined) delete set[k];
  });

  return set;
}

export const GET = withUser(async (_request, user, ctx) => {
  try {
    const { id } = await ctx.params;

    const data = await hasuraFetch(STAFF_BY_PK, { id }, { admin: true });
    const staff = data.staff_by_pk;

    if (!staff) {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 },
      );
    }

    const isSameOrg =
      user.role === "Super Admin" ||
      user.organization?.id === staff.organization_id;

    if (!isSameOrg) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { employee: toStaffRecord(staff) },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/employee/[id] error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const PUT = withUser(async (request, user, ctx) => {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    const existing = await hasuraFetch(STAFF_BY_PK, { id }, { admin: true });
    const staff = existing.staff_by_pk;

    if (!staff) {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 },
      );
    }

    const isSameOrg =
      user.role === "Super Admin" ||
      user.organization?.id === staff.organization_id;

    if (!isSameOrg) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const set = buildUpdateSet(body);

    if (Object.keys(set).length === 0) {
      return NextResponse.json(
        { message: "No valid changes provided." },
        { status: 400 },
      );
    }

    const updated = await hasuraFetch(
      UPDATE_STAFF,
      { id, set },
      { admin: true },
    );

    return NextResponse.json(
      {
        message: "Staff member updated.",
        employee: toStaffRecord(updated.update_staff_by_pk),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/employee/[id] error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
