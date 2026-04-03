export const ROLE_IDS = {
  CEO: "CEO",
  Manager: "Manager",
  Employee: "Employee",
  HR: "HR",
  TeamLead: "TeamLead",
} as const;

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

type RoleConfig = {
  id: RoleId;
  label: string;
  defaultRoute: string;
  dashboardRoute?: string;
};

export const ROLE_CONFIG: Record<RoleId, RoleConfig> = {
  CEO: {
    id: ROLE_IDS.CEO,
    label: "Chief Executive Officer",
    defaultRoute: "/ceo/dashboard",
    dashboardRoute: "/ceo/dashboard",
  },
  Manager: {
    id: ROLE_IDS.Manager,
    label: "Manager",
    defaultRoute: "/manager/dashboard",
    dashboardRoute: "/manager/dashboard",
  },
  Employee: {
    id: ROLE_IDS.Employee,
    label: "Employee",
    defaultRoute: "/employee/dashboard",
    dashboardRoute: "/employee/dashboard",
  },
  HR: {
    id: ROLE_IDS.HR,
    label: "Human Resources",
    defaultRoute: "/home",
  },
  TeamLead: {
    id: ROLE_IDS.TeamLead,
    label: "Team Lead",
    defaultRoute: "/home",
  },
};

export const getRoleDefaultRoute = (role?: string): string => {
  if (!role) {
    return ROLE_CONFIG.Employee.defaultRoute;
  }

  return ROLE_CONFIG[role as RoleId]?.defaultRoute ?? ROLE_CONFIG.Employee.defaultRoute;
};

export const isKnownRole = (role?: string): role is RoleId => {
  if (!role) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(ROLE_CONFIG, role);
};
