import mongoose from "mongoose";

const InviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["Manager", "Employee"],
      default: "Employee",
    },

    scopeType: {
      type: String,
      enum: ["team", "company"],
      default: "team",
    },

    scopeTeamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teams",
      },
    ],

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Invite ||
mongoose.model("Invite", InviteSchema);