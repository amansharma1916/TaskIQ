import crypto from "crypto";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.JWT_REFRESH_TOKEN_TTL_DAYS || 7);

const getAccessTokenSecret = () => {
  const secret = process.env.JWT_ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_TOKEN_SECRET is not configured");
  }
  return secret;
};

export const buildAuthUser = (user, company = null) => ({
  id: user._id,
  name: user.name,
  companyId: toCompanyIdString(company?._id ?? user.companyId),
  companyName: company?.companyName ?? null,
  workEmail: user.workEmail,
  teamSize: company?.teamSize ?? null,
  role: user.role,
});

export const hashRefreshToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const toCompanyIdString = (companyId) => {
  if (!companyId) {
    return null;
  }

  if (typeof companyId === "object" && companyId._id) {
    return String(companyId._id);
  }

  return typeof companyId === "string" ? companyId : String(companyId);
};

export const createAccessToken = (user) => {
  const payload = {
    sub: String(user._id),
    role: user.role,
    companyId: toCompanyIdString(user.companyId),
    workEmail: user.workEmail,
  };

  return jwt.sign(payload, getAccessTokenSecret(), { expiresIn: ACCESS_TOKEN_TTL });
};

export const createRefreshToken = () => crypto.randomBytes(48).toString("hex");

export const getRefreshTokenExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return date;
};

export const buildAuthResponse = (user, company = null) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenExpiresAt = getRefreshTokenExpiryDate();

  return {
    user: buildAuthUser(user, company),
    accessToken,
    refreshToken,
    refreshTokenHash,
    refreshTokenExpiresAt,
  };
};
