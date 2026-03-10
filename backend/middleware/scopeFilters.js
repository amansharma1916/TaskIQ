import mongoose from "mongoose";

const objectId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const objectIdArray = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => objectId(value)).filter(Boolean);
};

export const getScopedCompanyId = (req) => req.authz?.companyId ?? req.user?.companyId ?? null;

export const getManagerScopeTeamIds = (req) => {
  const ids = objectIdArray(req.authz?.managerTeamIds ?? []);
  return [...new Set(ids.map((id) => String(id)))].map((id) => new mongoose.Types.ObjectId(id));
};

export const isCeo = (req) => req.authz?.effectiveRole === "CEO";

export const applyProjectScopeFilter = (req, baseFilter = {}) => {
  if (!req.authz?.scopedEnforcement || isCeo(req)) {
    return { ...baseFilter };
  }

  if (req.authz?.effectiveRole === "Manager") {
    const managerTeamIds = getManagerScopeTeamIds(req);

    if (req.authz?.managerScope === "company") {
      return { ...baseFilter };
    }

    return {
      ...baseFilter,
      assignedTeams: { $in: managerTeamIds.length > 0 ? managerTeamIds : [] },
    };
  }

  const teamId = objectId(req.authz?.memberTeamId);
  return {
    ...baseFilter,
    assignedTeams: { $in: teamId ? [teamId] : [] },
  };
};

export const applyTaskScopeFilter = (req, baseFilter = {}) => {
  if (!req.authz?.scopedEnforcement || isCeo(req)) {
    return { ...baseFilter };
  }

  if (req.authz?.effectiveRole === "Manager") {
    if (req.authz?.managerScope === "company") {
      return { ...baseFilter };
    }

    const managerTeamIds = getManagerScopeTeamIds(req);
    return {
      ...baseFilter,
      teamId: { $in: managerTeamIds.length > 0 ? managerTeamIds : [] },
    };
  }

  const teamId = objectId(req.authz?.memberTeamId);
  return {
    ...baseFilter,
    teamId: { $in: teamId ? [teamId] : [] },
  };
};

export const applyTeamScopeFilter = (req, baseFilter = {}) => {
  if (!req.authz?.scopedEnforcement || isCeo(req)) {
    return { ...baseFilter };
  }

  if (req.authz?.effectiveRole === "Manager") {
    if (req.authz?.managerScope === "company") {
      return { ...baseFilter };
    }

    const managerTeamIds = getManagerScopeTeamIds(req);
    return {
      ...baseFilter,
      _id: { $in: managerTeamIds.length > 0 ? managerTeamIds : [] },
    };
  }

  const teamId = objectId(req.authz?.memberTeamId);
  return {
    ...baseFilter,
    _id: { $in: teamId ? [teamId] : [] },
  };
};

export const isTeamInManagerScope = (req, teamId) => {
  if (isCeo(req) || !req.authz?.scopedEnforcement) {
    return true;
  }

  if (req.authz?.effectiveRole !== "Manager") {
    const memberTeamId = objectId(req.authz?.memberTeamId);
    return Boolean(memberTeamId && String(memberTeamId) === String(teamId));
  }

  if (req.authz?.managerScope === "company") {
    return true;
  }

  const managerTeamIds = getManagerScopeTeamIds(req);
  return managerTeamIds.some((id) => String(id) === String(teamId));
};
