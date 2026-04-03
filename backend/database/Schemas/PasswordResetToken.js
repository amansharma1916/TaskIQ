import mongoose from "mongoose";

const PasswordResetTokenSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Users",
			required: true,
			index: true,
		},
		tokenHash: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		expiresAt: {
			type: Date,
			required: true,
			index: true,
		},
		used: {
			type: Boolean,
			default: false,
			index: true,
		},
		usedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetTokenSchema.index({ userId: 1, used: 1 });

const PasswordResetToken =
	mongoose.models.PasswordResetToken ??
	mongoose.model("PasswordResetToken", PasswordResetTokenSchema);

export default PasswordResetToken;