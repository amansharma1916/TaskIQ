export const authorizeCapability = (...requiredCapabilities) => (req, res, next) => {
  const capabilities = req.authz?.capabilities ?? [];

  if (capabilities.includes("*")) {
    return next();
  }

  if (!requiredCapabilities.every((capability) => capabilities.includes(capability))) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};
