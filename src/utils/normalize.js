export function normalizeProjectRow(p) {
  return {
    _id: p.id,
    id: p.id,
    campaignName: p.campaign_name,
    startDate: p.start_date,
    endDate: p.end_date,
    doorsRemaining: p.doors_remaining,
    totalDoorsKnocked: p.total_doors_knocked,
    stateDirector: p.state_director,
    organization: p.organization_id,
  };
}

export function normalizeProjectDetail(p) {
  return {
    ...normalizeProjectRow(p),

    assignedEmployees: (p.project_employees ?? []).map((pe) => ({
      _id: pe.employee.id,
      id: pe.employee.id,
      firstName: pe.employee.first_name,
      lastName: pe.employee.last_name,
    })),

    schedule: (p.project_schedules ?? []).map((s) => ({
      id: s.id,
      date: s.work_date,
      employees: (s.project_schedule_employees ?? []).map((se) => ({
        _id: se.employee.id,
        id: se.employee.id,
        firstName: se.employee.first_name,
        lastName: se.employee.last_name,
      })),
    })),
  };
}
