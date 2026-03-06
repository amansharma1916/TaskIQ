import mongoose from "mongoose";

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

const Members =
  mongoose.models.Members ||
  mongoose.model("Members", MemberSchema);

export default Members;