import express from "express";
import bcrypt from "bcryptjs";
import Users from "../database/Schemas/Users.js";
import Company from "../database/Schemas/Company.js";
import Invite from "../database/Schemas/Invite.js";
import Members from "../database/Schemas/Members.js";
import { buildAuthResponse, hashRefreshToken } from "../utilities/authTokens.js";

const router = express.Router();
const TEAM_SIZE_RANGES = ["1-10", "11-50", "51-200", "201+"];

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
		});
		createdUserId = user._id;

		const member = await Members.create({
			memberName: name,
			memberRole: invite.role,
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

export default router;