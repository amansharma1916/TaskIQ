import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema(
{
  memberName: {
    type: String,
    required: true
  },

  memberRole: {
    type: String,
    default: "member"
  },

  memberTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teams"
  }

},
{ timestamps: true }
);

const Members =
  mongoose.models.Members ||
  mongoose.model("Members", MemberSchema);

export default Members;