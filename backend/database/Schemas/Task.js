import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Projects",
      required: true,
      index: true,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teams",
      default: null,
      index: true,
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Members",
      default: null,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  { timestamps: true }
);

TaskSchema.index({ companyId: 1, projectId: 1, status: 1 });
TaskSchema.index({ companyId: 1, assignee: 1, dueDate: 1 });
TaskSchema.index({ companyId: 1, projectId: 1, teamId: 1 });

const Tasks =
  mongoose.models.Tasks ||
  mongoose.model("Tasks", TaskSchema);

export default Tasks;