import express from "express";
import ActivityLog from "../database/Schemas/ActivityLog.js";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";
import { roleResolution } from "../middleware/roleResolution.js";
import { authorizeCapability } from "../middleware/authorizeCapability.js";
import { getManagerScopeTeamIds, isCeo } from "../middleware/scopeFilters.js";

const router = express.Router();

router.use(authenticateJWT);
router.use(roleResolution);

const requireCompanyScope = (req, res) => {
  const companyId = req.authz?.companyId ?? req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ message: "Authenticated user is not linked to a company" });
    return null;
  }
  return companyId;
};

router.get("/", authorizeRoles("CEO", "Manager"), authorizeCapability("activity:read"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const limitRaw = Number(req.query?.limit ?? 50);
    const limit = Number.isNaN(limitRaw) ? 50 : Math.min(Math.max(limitRaw, 1), 200);

    const filter = { companyId };

    if (!isCeo(req) && req.authz?.scopedEnforcement && req.authz?.managerScope !== "company") {
      const managerTeamIds = getManagerScopeTeamIds(req);
      filter.$or = [
        { teamId: { $in: managerTeamIds.length > 0 ? managerTeamIds : [] } },
        { actorUserId: req.user.userId },
      ];
    }

    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(limit);

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
