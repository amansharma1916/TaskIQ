import express from "express";
import bcrypt from "bcryptjs";
import RegisteredUsers from "../database/Schemas/Registered_Users.js";

const router = express.Router();
const TEAM_SIZE_RANGES = ["1-10", "11-50", "51-200", "201+"];

router.post("/register", async (req, res) => {
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

		const existingUser = await RegisteredUsers.findOne({
			workEmail: String(workEmail).toLowerCase().trim(),
		});

		if (existingUser) {
			return res.status(409).json({ message: "Email is already registered" });
		}

		const createdUser = await RegisteredUsers.create({
			name,
			companyName,
			workEmail,
			teamSize: normalizedTeamSize,
			password,
		});

		return res.status(201).json({
			message: "User registered successfully",
			user: {
				id: createdUser._id,
				name: createdUser.name,
				companyName: createdUser.companyName,
				workEmail: createdUser.workEmail,
				teamSize: createdUser.teamSize,
			},
		});
	} catch (error) {
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

		const user = await RegisteredUsers.findOne({
			workEmail: String(workEmail).toLowerCase().trim(),
		}).select("+password");

		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		return res.status(200).json({
			message: "Login successful",
			user: {
				id: user._id,
				name: user.name,
				companyName: user.companyName,
				workEmail: user.workEmail,
				teamSize: user.teamSize,
			},
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});


export default router;
