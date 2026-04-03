import mongoose from "mongoose";

const ProjectUpdateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Projects",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    audienceMode: {
      type: String,
      enum: ["company", "teams", "projectTeams"],
      required: true,
      default: "company",
      index: true,
    },
    targetTeamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teams",
        index: true,
      },
    ],
    visibleRoles: [
      {
        type: String,
        enum: ["CEO", "Manager", "Employee"],
      },
    ],
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    createdByRole: {
      type: String,
      enum: ["CEO", "Manager", "Employee"],
      required: true,
    },
    lastEditedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    lastEditedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ProjectUpdateSchema.index({ companyId: 1, createdAt: -1 });
ProjectUpdateSchema.index({ companyId: 1, projectId: 1, createdAt: -1 });
ProjectUpdateSchema.index({ companyId: 1, audienceMode: 1, createdAt: -1 });
ProjectUpdateSchema.index({ companyId: 1, targetTeamIds: 1, createdAt: -1 });

const ProjectUpdate =
  mongoose.models.ProjectUpdate ||
  mongoose.model("ProjectUpdate", ProjectUpdateSchema);

export default ProjectUpdate;
