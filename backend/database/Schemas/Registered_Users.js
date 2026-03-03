import mongoose from "mongoose";
import attachPasswordHashing from "../middleware/PassHashing.js";

const TEAM_SIZE_RANGES = ["1-10", "11-50", "51-200", "201+"];

const RegisteredUsersSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true, 
  }
);

attachPasswordHashing(RegisteredUsersSchema);

const RegisteredUsers =
  mongoose.models.RegisteredUsers ??
  mongoose.model("RegisteredUsers", RegisteredUsersSchema);

export default RegisteredUsers;