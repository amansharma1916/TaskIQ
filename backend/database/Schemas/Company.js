import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },

    teamSize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201+"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Company ||
mongoose.model("Company", CompanySchema);