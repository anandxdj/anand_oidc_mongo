import ApiError from "../../common/utils/api-error.js";
import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import User from "./auth.model.js";
import redis from "../../common/config/redis.js";

const readAccessToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer")) {
    return req.headers.authorization.split(" ")[1];
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
};

// Authenticates using the short-lived access token (Authorization or httpOnly cookie)
const authenticate = async (req, res, next) => {
  const clearAuth = () => {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
  };

  const token = readAccessToken(req);
  if (!token) {
    clearAuth();
    throw ApiError.unauthorized("Not authenticated");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    clearAuth();
    throw ApiError.unauthorized("Session expired or invalid");
  }

  const sessionRedisKey = decoded.sid
    ? `session:${decoded.id}:${decoded.sid}`
    : `session:${decoded.id}`;

  // Check Redis whitelist for either scoped session key or legacy single-session key.
  const isWhitelisted = await redis.get(sessionRedisKey);
  if (!isWhitelisted) {
    clearAuth();
    throw ApiError.unauthorized("Session expired or revoked");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    clearAuth();
    throw ApiError.unauthorized("User no longer exists");
  }

  req.user = {
    id: user._id,
    sessionId: decoded.sid || null,
    role: user.role,
    name: user.name,
    email: user.email,
  };
  next();
};

/**
 * Like authenticate but does not throw; attaches req.user when a valid token is present.
 */
const tryAttachUser = async (req, res, next) => {
  const token = readAccessToken(req);
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    const sessionRedisKey = decoded.sid
      ? `session:${decoded.id}:${decoded.sid}`
      : `session:${decoded.id}`;
    const isWhitelisted = await redis.get(sessionRedisKey);
    if (isWhitelisted) {
      const user = await User.findById(decoded.id);
      if (user) {
      req.user = {
        id: user._id,
        sessionId: decoded.sid || null,
        role: user.role,
        name: user.name,
        email: user.email,
      };
      }
    }
  } catch {
    // invalid or expired — treat as anonymous
  }
  next();
};

// Higher-order function — returns middleware configured with allowed roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        "You do not have permission to perform this action",
      );
    }
    next();
  };
};

export { authenticate, authorize, tryAttachUser };
