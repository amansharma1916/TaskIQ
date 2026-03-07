import express from "express";
import Members from "../database/Schemas/Members.js";
import Teams from "../database/Schemas/Teams.js";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateJWT);

const requireCompanyScope = (req, res) => {
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ message: "Authenticated user is not linked to a company" });
    return null;
  }
  return companyId;
};

router.post("/add", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const { memberName, memberRole, teamId, userId } = req.body;
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    if (!memberName) {
      return res.status(400).json({ message: "memberName is required" });
    }

    let resolvedCompanyId = companyId;
    if (teamId) {
      const team = await Teams.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.companyId && String(team.companyId) !== String(companyId)) {
        return res.status(403).json({ message: "Team not in this company" });
      }

      resolvedCompanyId = team?.companyId ?? null;
    }

    const member = await Members.create({
      memberName,
      memberRole,
      memberTeam: teamId || null,
      userId: userId || null,
      companyId: resolvedCompanyId,
    });

    if (teamId) {
      await Teams.findByIdAndUpdate(teamId, {
        $push: { teamMembers: member._id },
        $inc: { totalMembers: 1 }
      });
    }

    res.status(201).json(member);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const members = await Members.find({ companyId }).populate("memberTeam");

    res.json(members);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorizeRoles("CEO", "Manager"), async (req, res) => {
  try {
    const companyId = requireCompanyScope(req, res);
    if (!companyId) {
      return;
    }

    const member = await Members.findOneAndDelete({ _id: req.params.id, companyId });

    if (!member) return res.status(404).json({ message: "Member not found" });

    if (member.memberTeam) {
      await Teams.findByIdAndUpdate(member.memberTeam, {
        $pull: { teamMembers: member._id },
        $inc: { totalMembers: -1 }
      });
    }

    res.json({ message: "Member removed" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;