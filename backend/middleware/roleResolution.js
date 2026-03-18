import mongoose from "mongoose";
import Users from "../database/Schemas/Users.js";
import Members from "../database/Schemas/Members.js";

const normalizeBoolean = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return !["0", "false", "off", "no"].includes(normalized);
};

export const isScopedEnforcementEnabled = () =>
  normalizeBoolean(process.env.RBAC_SCOPED_ENFORCEMENT, true);

const toObjectIdArray = (ids) => {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids
    .map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null))
    .filter(Boolean);
};

const buildCapabilities = ({ effectiveRole, managerScope }) => {
  if (effectiveRole === "CEO") {
    return ["*"];
  }

  if (effectiveRole === "Manager") {
    const base = [
      "projects:read",
      "projects:update",
      "updates:create",
      "updates:read",
      "updates:update",
      "updates:delete",
      "updates:pin",
      "tasks:read",
      "tasks:create",
      "tasks:update",
      "tasks:assign",
      "tasks:status:update",
      "teams:read",
      "teams:update",
      "members:read",
      "invite:create",
      "activity:read",
    ];

    if (managerScope === "company") {
      base.push("projects:create", "teams:create");
      base.push("projects:manage:company", "tasks:manage:company", "teams:manage:company");
    }

    return base;
  }

  return ["tasks:read", "tasks:status:update", "teams:read", "projects:read", "updates:read"];
};

export const roleResolution = async (req, _res, next) => {
  if (!req.user?.userId) {
    return next();
  }

  try {
    const user = await Users.findById(req.user.userId).select("role companyId managerScope managerTeamIds");
    const companyId = user?.companyId ?? req.user.companyId ?? null;

    const member = companyId
      ? await Members.findOne({ userId: req.user.userId, companyId }).select("memberRole memberTeam scopeType scopeTeamIds")
      : null;

    const effectiveRole = user?.role ?? req.user.role;
    const managerScope = user?.managerScope ?? "company";

    let managerTeamIds = toObjectIdArray(user?.managerTeamIds ?? []);

    if (managerTeamIds.length === 0) {
      managerTeamIds = toObjectIdArray(member?.scopeTeamIds ?? []);
    }

    if (managerTeamIds.length === 0 && member?.memberTeam) {
      managerTeamIds = [new mongoose.Types.ObjectId(member.memberTeam)];
    }

    req.authz = {
      companyId,
      effectiveRole,
      managerScope,
      managerTeamIds,
      memberRole: member?.memberRole ?? null,
      memberTeamId: member?.memberTeam ?? null,
      capabilities: buildCapabilities({ effectiveRole, managerScope }),
      scopedEnforcement: isScopedEnforcementEnabled(),
    };

    if (companyId) {
      req.user.companyId = String(companyId);
    }

    req.user.role = effectiveRole;

    return next();
  } catch {
    req.authz = {
      companyId: req.user.companyId ?? null,
      effectiveRole: req.user.role ?? null,
      managerScope: "company",
      managerTeamIds: [],
      memberRole: null,
      memberTeamId: null,
      capabilities: [],
      scopedEnforcement: isScopedEnforcementEnabled(),
    };
    return next();
  }
};
