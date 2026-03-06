import mongoose from "mongoose";
import attachPasswordHashing from "../middleware/PassHashing.js";

const TEAM_SIZE_RANGES = ["1-10", "11-50", "51-200", "201+"];

const CEOsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    companyName: { type: String, required: true, trim: true, maxlength: 150 },
    workEmail: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    teamSize: {
      type: String,
      enum: TEAM_SIZE_RANGES,
      default: "1-10",
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["CEO", "Manager", "Employee"],
      default: "CEO",
      trim: true,
    },
  },
  {
    timestamps: true, 
  }
);

attachPasswordHashing(CEOsSchema);

const CEOs =
  mongoose.models.CEOs ??
  mongoose.model("CEOs", CEOsSchema);

export default CEOs;