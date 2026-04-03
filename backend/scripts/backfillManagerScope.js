import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../database/db_connect.js";
import Users from "../database/Schemas/Users.js";
import Members from "../database/Schemas/Members.js";

dotenv.config();

const run = async () => {
  await connectDB();

  const managers = await Users.find({ role: "Manager" }).select("_id companyId managerScope managerTeamIds");

  let updatedCount = 0;
  let hydratedTeamIdsCount = 0;

  for (const manager of managers) {
    const updates = {};

    if (!manager.managerScope) {
      updates.managerScope = "company";
    }

    if (!Array.isArray(manager.managerTeamIds)) {
      updates.managerTeamIds = [];
    }

    const hasTeamIds = Array.isArray(manager.managerTeamIds) && manager.managerTeamIds.length > 0;

    if (!hasTeamIds && manager.companyId) {
      const memberRecords = await Members.find({
        companyId: manager.companyId,
        userId: manager._id,
        memberRole: "Manager",
        memberTeam: { $ne: null },
      }).select("memberTeam");

      const uniqueTeamIds = [...new Set(memberRecords.map((record) => String(record.memberTeam)).filter(Boolean))]
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (uniqueTeamIds.length > 0) {
        updates.managerTeamIds = uniqueTeamIds;
        hydratedTeamIdsCount += 1;
      }
    }

    if (Object.keys(updates).length > 0) {
      await Users.findByIdAndUpdate(manager._id, updates);
      updatedCount += 1;
    }
  }

  console.log(JSON.stringify({
    scannedManagers: managers.length,
    updatedManagers: updatedCount,
    hydratedManagerTeamIds: hydratedTeamIdsCount,
  }));

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => null);
  process.exit(1);
});
