import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    projectDescription: {
      type: String,
      default: "",
      trim: true,
    },

    projectStatus: {
      type: String,
      enum: ["planning", "active", "review", "completed", "blocked"],
      default: "planning",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    completedTasks: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalTasks: {
      type: Number,
      min: 0,
      default: 0,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    assignedTeams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teams",
      },
    ],

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
  },
  { timestamps: true }
);

ProjectSchema.index({ companyId: 1, projectStatus: 1 });
ProjectSchema.index({ dueDate: 1 });

const Projects =
  mongoose.models.Projects ||
  mongoose.model("Projects", ProjectSchema);

export default Projects;
