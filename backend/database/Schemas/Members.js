import mongoose from "mongoose";
import Users from "./Users.js";

const MemberSchema = new mongoose.Schema(
{
  memberName: {
    type: String,
    required: true
  },

  memberRole: {
    type: String,
    enum: ["Manager", "Employee"],
    default: "Employee"
  },

  memberTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teams"
  },

  scopeType: {
    type: String,
    enum: ["team", "company"],
    default: "team"
  },

  scopeTeamIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teams"
    }
  ],

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  }

},
{ timestamps: true }
);

MemberSchema.pre("validate", async function validateRoleScopeAlignment() {
  if (this.memberRole === "Manager") {
    this.scopeType = this.scopeType || "team";
  } else {
    this.scopeType = "team";
  }

  if (this.memberTeam) {
    const existsInScope = (this.scopeTeamIds ?? []).some((teamId) => String(teamId) === String(this.memberTeam));
    if (!existsInScope) {
      this.scopeTeamIds = [...(this.scopeTeamIds ?? []), this.memberTeam];
    }
  }

  if (this.scopeType === "company") {
    this.scopeTeamIds = [];
  }

  if (!this.userId) {
    return;
  }

  const linkedUser = await Users.findById(this.userId).select("role companyId");
  if (!linkedUser) {
    throw new Error("Linked user does not exist");
  }

  if (linkedUser.companyId && this.companyId && String(linkedUser.companyId) !== String(this.companyId)) {
    throw new Error("Member company must match linked user company");
  }

  if (linkedUser.role === "CEO") {
    throw new Error("CEO users cannot be persisted as members");
  }

  if (linkedUser.role === "Manager" && this.memberRole !== "Manager") {
    throw new Error("Member role must align with linked user role");
  }

  if (linkedUser.role === "Employee" && this.memberRole !== "Employee") {
    throw new Error("Member role must align with linked user role");
  }
});

MemberSchema.index(
  { companyId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      userId: { $type: "objectId" },
    },
  }
);
MemberSchema.index({ companyId: 1, memberTeam: 1 });

const Members =
  mongoose.models.Members ||
  mongoose.model("Members", MemberSchema);

export default Members;