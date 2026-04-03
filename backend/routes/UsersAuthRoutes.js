import express from "express";
import bcrypt from "bcryptjs";
import Users from "../database/Schemas/Users.js";
import Company from "../database/Schemas/Company.js";
import Invite from "../database/Schemas/Invite.js";
import Members from "../database/Schemas/Members.js";
import PasswordResetToken from "../database/Schemas/PasswordResetToken.js";
import { buildAuthResponse, hashRefreshToken } from "../utilities/authTokens.js";
import { createPasswordResetToken, getPasswordResetExpiryDate, hashPasswordResetToken } from "../utilities/resetPasswordTokens.js";
import { sendPasswordResetEmail } from "../utilities/sendEmail.js";
import logActivity from "../utilities/logActivity.js";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
const TEAM_SIZE_RANGES = ["1-10", "11-50", "51-200", "201+"];
const PASSWORD_RESET_TTL_HOURS = Number(process.env.PASSWORD_RESET_TOKEN_TTL_HOURS || 1);
const FORGOT_PASSWORD_MAX_ATTEMPTS = Number(process.env.FORGOT_PASSWORD_MAX_ATTEMPTS || 3);
const RESET_PASSWORD_MAX_ATTEMPTS = Number(process.env.RESET_PASSWORD_MAX_ATTEMPTS || 10);
const RATE_LIMIT_WINDOW_MS = Number(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const inMemoryRateLimitStore = new Map();

const normalizeEmail = (value) => String(value).toLowerCase().trim();

const consumeRateLimit = (key, maxAttempts, windowMs) => {
	const now = Date.now();
	const current = inMemoryRateLimitStore.get(key) || [];
	const fresh = current.filter((ts) => now - ts < windowMs);

	if (fresh.length >= maxAttempts) {
		inMemoryRateLimitStore.set(key, fresh);
		return true;
	}

	fresh.push(now);
	inMemoryRateLimitStore.set(key, fresh);
	return false;
};

const getRequestIp = (req) => {
	if (req.ip) {
		return req.ip;
	}

	const forwardedFor = req.headers["x-forwarded-for"];
	if (typeof forwardedFor === "string" && forwardedFor.trim()) {
		return forwardedFor.split(",")[0].trim();
	}

	return "unknown";
};

const getResetBaseUrl = () => {
	const base = process.env.RESET_PASSWORD_LINK_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173";
	return String(base).replace(/\/$/, "");
};

const createLogRequestForUser = (user) => ({
	authz: {
		companyId: user.companyId,
		effectiveRole: user.role,
	},
	user: {
		userId: user._id,
		companyId: user.companyId,
		role: user.role,
	},
});

const buildSafeProfile = (user) => ({
	id: String(user._id),
	name: user.name,
	workEmail: user.workEmail,
	role: user.role,
	managerScope: user.managerScope ?? "company",
	managerTeamIds: Array.isArray(user.managerTeamIds) ? user.managerTeamIds.map((teamId) => String(teamId)) : [],
	companyId: user.companyId ? String(user.companyId) : null,
});

const applySessionAndPersistUser = async (user, company = null) => {
	const authPayload = buildAuthResponse(user, company);
	user.refreshTokenHash = authPayload.refreshTokenHash;
	user.refreshTokenExpiresAt = authPayload.refreshTokenExpiresAt;
	await user.save();

	return {
		user: authPayload.user,
		accessToken: authPayload.accessToken,
		refreshToken: authPayload.refreshToken,
	};
};

router.post("/register", async (req, res) => {
	let createdUserId = null;
	try {
		const { name, companyName, workEmail, teamSize, password } = req.body;
		const normalizedTeamSize =
			typeof teamSize === "string" && teamSize.trim() ? teamSize.trim() : undefined;

		if (!name || !companyName || !workEmail || !password) {
			return res.status(400).json({
				message: "name, companyName, workEmail, and password are required",
			});
		}

		if (normalizedTeamSize && !TEAM_SIZE_RANGES.includes(normalizedTeamSize)) {
			return res.status(400).json({
				message: "teamSize must be one of: 1-10, 11-50, 51-200, 201+",
			});
		}

		const existingUser = await Users.findOne({
			workEmail: String(workEmail).toLowerCase().trim(),
		});

		if (existingUser) {
			return res.status(409).json({ message: "Email is already registered" });
		}

		const createdUser = await Users.create({
			name,
			workEmail,
			password,
			role: "CEO",
			managerScope: "company",
			managerTeamIds: [],
		});
		createdUserId = createdUser._id;

		const company = await Company.create({
			companyName,
			owner: createdUser._id,
			teamSize: normalizedTeamSize ?? "1-10",
		});

		createdUser.companyId = company._id;
		await createdUser.save();

		const session = await applySessionAndPersistUser(createdUser, company);

		return res.status(201).json({
			message: "User registered and logged in successfully",
			user: session.user,
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
		});
	} catch (error) {
		if (createdUserId) {
			await Users.findByIdAndDelete(createdUserId).catch(() => null);
		}
		return res.status(500).json({ message: error.message });
	}
});


router.post("/login", async (req, res) => {
	try {
		const { workEmail, password } = req.body;

		if (!workEmail || !password) {
			return res.status(400).json({
				message: "workEmail and password are required",
			});
		}

		const user = await Users.findOne({
			workEmail: String(workEmail).toLowerCase().trim(),
		})
			.select("+password +refreshTokenHash +refreshTokenExpiresAt")
			.populate("companyId");

		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const session = await applySessionAndPersistUser(user, user.companyId);

		return res.status(200).json({
			message: "Login successful",
			user: session.user,
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

router.post("/forgot-password", async (req, res) => {
	const genericMessage = "If an account exists for this email, a password reset link has been sent.";

	try {
		const { workEmail } = req.body;
		if (!workEmail) {
			return res.status(400).json({ message: "workEmail is required" });
		}

		const normalizedEmail = normalizeEmail(workEmail);
		const requestIp = getRequestIp(req);

		const emailLimited = consumeRateLimit(
			`forgot:email:${normalizedEmail}`,
			FORGOT_PASSWORD_MAX_ATTEMPTS,
			RATE_LIMIT_WINDOW_MS
		);
		const ipLimited = consumeRateLimit(
			`forgot:ip:${requestIp}`,
			FORGOT_PASSWORD_MAX_ATTEMPTS * 3,
			RATE_LIMIT_WINDOW_MS
		);

		if (emailLimited || ipLimited) {
			return res.status(429).json({ message: "Too many password reset attempts. Please try again later." });
		}

		const user = await Users.findOne({ workEmail: normalizedEmail }).select("+password");
		if (!user) {
			return res.status(200).json({ message: genericMessage });
		}

		const { token, tokenHash } = createPasswordResetToken();
		const expiresAt = getPasswordResetExpiryDate(PASSWORD_RESET_TTL_HOURS);

		await PasswordResetToken.deleteMany({ userId: user._id, used: false });
		await PasswordResetToken.create({
			userId: user._id,
			tokenHash,
			expiresAt,
		});

		const resetUrl = `${getResetBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
		await sendPasswordResetEmail({
			to: user.workEmail,
			name: user.name,
			resetUrl,
		});

		await logActivity({
			req: createLogRequestForUser(user),
			action: "password.reset.request",
			targetType: "auth",
			targetId: user._id,
			metadata: {
				ip: requestIp,
			},
		});

		return res.status(200).json({ message: genericMessage });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

router.post("/reset-password/validate", async (req, res) => {
	try {
		const { token } = req.body;
		if (!token || typeof token !== "string") {
			return res.status(400).json({ valid: false, message: "token is required" });
		}

		const tokenHash = hashPasswordResetToken(token);
		const resetToken = await PasswordResetToken.findOne({ tokenHash, used: false });
		if (!resetToken) {
			return res.status(200).json({ valid: false, message: "Token is invalid or expired" });
		}

		if (resetToken.expiresAt.getTime() < Date.now()) {
			return res.status(200).json({ valid: false, message: "Token is invalid or expired" });
		}

		const user = await Users.findById(resetToken.userId);
		if (!user) {
			return res.status(200).json({ valid: false, message: "Token is invalid or expired" });
		}

		return res.status(200).json({
			valid: true,
			expiresInSeconds: Math.max(1, Math.floor((resetToken.expiresAt.getTime() - Date.now()) / 1000)),
			workEmail: user.workEmail,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

router.post("/reset-password", async (req, res) => {
	try {
		const { token, newPassword } = req.body;
		if (!token || typeof token !== "string" || !newPassword) {
			return res.status(400).json({ message: "token and newPassword are required" });
		}

		if (String(newPassword).length < 8) {
			return res.status(400).json({ message: "Password must be at least 8 characters long" });
		}

		const requestIp = getRequestIp(req);
		const tokenHash = hashPasswordResetToken(token);
		const tokenLimited = consumeRateLimit(
			`reset:token:${tokenHash}`,
			RESET_PASSWORD_MAX_ATTEMPTS,
			RATE_LIMIT_WINDOW_MS
		);
		const ipLimited = consumeRateLimit(
			`reset:ip:${requestIp}`,
			RESET_PASSWORD_MAX_ATTEMPTS,
			RATE_LIMIT_WINDOW_MS
		);

		if (tokenLimited || ipLimited) {
			return res.status(429).json({ message: "Too many password reset attempts. Please try again later." });
		}

		const resetToken = await PasswordResetToken.findOne({ tokenHash, used: false });
		if (!resetToken || resetToken.expiresAt.getTime() < Date.now()) {
			return res.status(400).json({ message: "Token is invalid or expired" });
		}

		const user = await Users.findById(resetToken.userId).select("+password +refreshTokenHash +refreshTokenExpiresAt");
		if (!user) {
			return res.status(400).json({ message: "Token is invalid or expired" });
		}

		const isSamePassword = await bcrypt.compare(newPassword, user.password);
		if (isSamePassword) {
			return res.status(400).json({ message: "New password must be different from your current password" });
		}

		user.password = newPassword;
		user.refreshTokenHash = null;
		user.refreshTokenExpiresAt = null;

		resetToken.used = true;
		resetToken.usedAt = new Date();

		await Promise.all([user.save(), resetToken.save()]);
		await PasswordResetToken.deleteMany({ userId: user._id, used: false });

		await logActivity({
			req: createLogRequestForUser(user),
			action: "password.reset.confirm",
			targetType: "auth",
			targetId: user._id,
			metadata: {
				ip: requestIp,
			},
		});

		return res.status(200).json({ message: "Password reset successful. Please log in with your new password." });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

router.post("/register-with-invite", async (req, res) => {
	let createdUserId = null;
	let createdMemberId = null;
	try {
		const { token, name, password } = req.body;

		if (!token || !name || !password) {
			return res.status(400).json({ message: "token, name, and password are required" });
		}

		if (String(password).length < 8) {
			return res.status(400).json({ message: "Password must be at least 8 characters long" });
		}

		const invite = await Invite.findOne({ token, used: false });
		if (!invite) {
			return res.status(400).json({ message: "Invalid invite" });
		}

		const inviteScopeType =
			invite.scopeType === "company" || invite.scopeType === "team"
				? invite.scopeType
				: Array.isArray(invite.scopeTeamIds) && invite.scopeTeamIds.length > 0
					? "team"
					: "company";
		const inviteScopeTeamIds = inviteScopeType === "team" ? invite.scopeTeamIds ?? [] : [];

		const existingUser = await Users.findOne({ workEmail: invite.email });
		if (existingUser) {
			return res.status(409).json({ message: "This invite email is already registered" });
		}

		const company = await Company.findById(invite.companyId);
		if (!company) {
			return res.status(404).json({ message: "Company not found" });
		}

		const user = await Users.create({
			name,
			workEmail: invite.email,
			password,
			role: invite.role,
			companyId: invite.companyId,
			managerScope: invite.role === "Manager" ? inviteScopeType : "team",
			managerTeamIds: invite.role === "Manager" ? inviteScopeTeamIds : [],
		});
		createdUserId = user._id;

		const member = await Members.create({
			memberName: name,
			memberRole: invite.role,
			scopeType: inviteScopeType,
			scopeTeamIds: inviteScopeTeamIds,
			memberTeam: inviteScopeTeamIds[0] ?? null,
			userId: user._id,
			companyId: invite.companyId,
		});
		createdMemberId = member._id;

		invite.used = true;
		await invite.save();

		const session = await applySessionAndPersistUser(user, company);

		return res.status(201).json({
			message: "Account created and logged in",
			user: session.user,
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
		});
	} catch (error) {
		if (createdMemberId) {
			await Members.findByIdAndDelete(createdMemberId).catch(() => null);
		}
		if (createdUserId) {
			await Users.findByIdAndDelete(createdUserId).catch(() => null);
		}
		return res.status(500).json({ message: error.message });
	}
});

router.post("/refresh", async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken || typeof refreshToken !== "string") {
			return res.status(400).json({ message: "refreshToken is required" });
		}

		const refreshTokenHash = hashRefreshToken(refreshToken);
		const user = await Users.findOne({ refreshTokenHash })
			.select("+refreshTokenHash +refreshTokenExpiresAt")
			.populate("companyId");

		if (!user) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt.getTime() < Date.now()) {
			user.refreshTokenHash = null;
			user.refreshTokenExpiresAt = null;
			await user.save();
			return res.status(401).json({ message: "Refresh token expired" });
		}

		const session = await applySessionAndPersistUser(user, user.companyId);

		return res.status(200).json({
			message: "Token refreshed",
			user: session.user,
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

router.post("/logout", async (req, res) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken || typeof refreshToken !== "string") {
			return res.status(200).json({ message: "Logged out" });
		}

		const refreshTokenHash = hashRefreshToken(refreshToken);
		const user = await Users.findOne({ refreshTokenHash }).select("+refreshTokenHash +refreshTokenExpiresAt");

		if (user) {
			user.refreshTokenHash = null;
			user.refreshTokenExpiresAt = null;
			await user.save();
		}

		return res.status(200).json({ message: "Logged out" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

router.get("/me", authenticateJWT, authorizeRoles("CEO", "Manager", "Employee"), async (req, res) => {
	try {
		const user = await Users.findById(req.user.userId);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json({ user: buildSafeProfile(user) });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

router.put("/me", authenticateJWT, authorizeRoles("CEO", "Manager", "Employee"), async (req, res) => {
	try {
		const { name, workEmail } = req.body;

		if (!name || !workEmail) {
			return res.status(400).json({ message: "name and workEmail are required" });
		}

		const normalizedName = String(name).trim();
		const normalizedWorkEmail = normalizeEmail(workEmail);

		if (!normalizedName) {
			return res.status(400).json({ message: "name is required" });
		}

		const user = await Users.findById(req.user.userId);
		const user_member = await Members.findOne({ userId: req.user.userId });
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const existingUser = await Users.findOne({ workEmail: normalizedWorkEmail });
		if (existingUser && String(existingUser._id) !== String(user._id)) {
			return res.status(409).json({ message: "Email is already registered" });
		}

		user.name = normalizedName;
		user.workEmail = normalizedWorkEmail;
		user_member.memberName = normalizedName;
		user_member.memberEmail = normalizedWorkEmail;
		await user_member.save();
		await user.save();

		return res.status(200).json({
			message: "Profile updated successfully",
			user: buildSafeProfile(user),
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

router.patch("/me/password", authenticateJWT, authorizeRoles("CEO", "Manager", "Employee"), async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({ message: "currentPassword and newPassword are required" });
		}

		if (String(newPassword).length < 8) {
			return res.status(400).json({ message: "Password must be at least 8 characters long" });
		}

		const user = await Users.findById(req.user.userId).select("+password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ message: "Current password is incorrect" });
		}

		if (currentPassword === newPassword) {
			return res.status(400).json({ message: "New password must be different from current password" });
		}

		user.password = newPassword;
		await user.save();

		return res.status(200).json({ message: "Password updated successfully" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

export default router;