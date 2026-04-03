import mongoose from "mongoose";

const ProjectUpdateReadStateSchema = new mongoose.Schema(
  {
    updateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectUpdate",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    readAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

ProjectUpdateReadStateSchema.index({ updateId: 1, userId: 1 }, { unique: true });
ProjectUpdateReadStateSchema.index({ companyId: 1, userId: 1, readAt: -1 });

const ProjectUpdateReadState =
  mongoose.models.ProjectUpdateReadState ||
  mongoose.model("ProjectUpdateReadState", ProjectUpdateReadStateSchema);

export default ProjectUpdateReadState;
