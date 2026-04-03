import crypto from "crypto";

export const hashPasswordResetToken = (token) => {
	return crypto.createHash("sha256").update(String(token)).digest("hex");
};

export const createPasswordResetToken = () => {
	const token = crypto.randomBytes(32).toString("hex");
	return {
		token,
		tokenHash: hashPasswordResetToken(token),
	};
};

export const getPasswordResetExpiryDate = (ttlHours = 1) => {
	const ttl = Number(ttlHours);
	const validHours = Number.isFinite(ttl) && ttl > 0 ? ttl : 1;
	return new Date(Date.now() + validHours * 60 * 60 * 1000);
};
