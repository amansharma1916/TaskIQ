import mongoose from "mongoose";
import attachPasswordHashing from "../middleware/PassHashing.js";

const UsersSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    workEmail: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    role: {
      type: String,
      enum: ["CEO", "Manager", "Employee"],
      default: "CEO",
      trim: true,
    },
    managerScope: {
      type: String,
      enum: ["company", "team"],
      default: "company",
    },
    managerTeamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teams",
      },
    ],
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    refreshTokenExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UsersSchema.index({ companyId: 1, role: 1 });

attachPasswordHashing(UsersSchema);

const Users =
  mongoose.models.Users ??
  mongoose.model("Users", UsersSchema);

export default Users;