import bcrypt from "bcryptjs";

const DEFAULT_SALT_ROUNDS = 12;

const resolveSaltRounds = () => {
	const parsed = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "", 10);
	if (Number.isNaN(parsed) || parsed < 4 || parsed > 15) {
		return DEFAULT_SALT_ROUNDS;
	}
	return parsed;
};

const attachPasswordHashing = (schema) => {
	schema.pre("save", async function passwordHashing(next) {
		if (!this.isModified("password")) {
			return next();
		}

		try {
			this.password = await bcrypt.hash(this.password, resolveSaltRounds());
			return next();
		} catch (error) {
			return next(error);
		}
	});
};

export default attachPasswordHashing;
