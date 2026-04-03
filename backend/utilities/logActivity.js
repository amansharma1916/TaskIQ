import mongoose from "mongoose";
import ActivityLog from "../database/Schemas/ActivityLog.js";

const toId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const toRole = (value) => {
  if (["CEO", "Manager", "Employee"].includes(value)) {
    return value;
  }
  return "Employee";
};

const logActivity = async ({ req, action, targetType, targetId = null, teamId = null, metadata = null }) => {
  const companyId = req.authz?.companyId ?? req.user?.companyId;
  const actorUserId = req.user?.userId;

  if (!companyId || !actorUserId) {
    return;
  }

  try {
    await ActivityLog.create({
      companyId: toId(companyId),
      actorUserId: toId(actorUserId),
      actorRole: toRole(req.authz?.effectiveRole ?? req.user?.role),
      action,
      targetType,
      targetId: toId(targetId),
      teamId: toId(teamId),
      metadata,
    });
  } catch {
    // Activity logging should never block business flows.
  }
};

export default logActivity;
