import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
{
  teamName: {
    type: String,
    required: true
  },

  teamDescription: {
    type: String
  },

  teamTags: [
    {
      type: String
    }
  ],

  teamMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Members"
    }
  ],

  totalMembers: {
    type: Number,
    default: 0
  },

  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Members"
  }

},
{ timestamps: true }
);

const Teams =
  mongoose.models.Teams ||
  mongoose.model("Teams", TeamSchema);

export default Teams;