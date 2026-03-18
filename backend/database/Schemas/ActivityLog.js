import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ["CEO", "Manager", "Employee"],
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["project", "task", "team", "member", "invite", "auth", "update"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teams",
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ companyId: 1, createdAt: -1 });
ActivityLogSchema.index({ companyId: 1, teamId: 1, createdAt: -1 });
ActivityLogSchema.index({ companyId: 1, actorUserId: 1, createdAt: -1 });

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);

export default ActivityLog;
