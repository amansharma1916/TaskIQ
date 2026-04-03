import jwt from "jsonwebtoken";

const getAccessTokenSecret = () => {
  const secret = process.env.JWT_ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_TOKEN_SECRET is not configured");
  }
  return secret;
};

export const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid authorization token" });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: "Missing or invalid authorization token" });
    }

    const decoded = jwt.verify(token, getAccessTokenSecret());

    req.user = {
      userId: decoded.sub,
      role: decoded.role,
      companyId: decoded.companyId || null,
      workEmail: decoded.workEmail,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user?.role) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};
