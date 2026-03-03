import mongoose from "mongoose";
import attachPasswordHashing from "../middleware/PassHashing.js";

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
    teamSize: { type: Number, min: 1, default: 1 },
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