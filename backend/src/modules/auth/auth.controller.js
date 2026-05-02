import * as authService from "./auth.service.js";
import ApiResponse from "../../common/utils/api-response.js";

const readClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
};

const register = async (req, res) => {
  const user = await authService.register(req.body);
  ApiResponse.created(
    res,
    "Registration successful. Please verify your email.",
    user,
  );
};

const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 15 * 60 * 1000, // matches typical access token TTL; refresh re-issues
};

const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, {
    userAgent: req.headers["user-agent"],
    ipAddress: readClientIp(req),
  });

  // Refresh token goes in httpOnly cookie — not accessible to JS
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie("accessToken", accessToken, accessCookieOptions);

  ApiResponse.ok(res, "Login successful", { user, accessToken });
};

const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  const { accessToken } = await authService.refresh(token);
  res.cookie("accessToken", accessToken, accessCookieOptions);
  ApiResponse.ok(res, "Token refreshed", { accessToken });
};

const logout = async (req, res) => {
  await authService.logout(req.user.id, req.user.sessionId);
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  ApiResponse.ok(res, "Logged out successfully");
};

const verifyEmail = async (req, res) => {
  await authService.verifyEmail(req.params.token);
  ApiResponse.ok(res, "Email verified successfully");
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  ApiResponse.ok(res, "Password reset email sent");
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  ApiResponse.ok(res, "Password reset successful");
};

const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  ApiResponse.ok(res, "User profile", user);
};

const updateProfile = async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  ApiResponse.ok(res, "Profile updated successfully", user);
};

const listSessions = async (req, res) => {
  const sessions = await authService.listSessions(req.user.id, req.user.sessionId);
  ApiResponse.ok(res, "Active sessions", sessions);
};

const revokeSession = async (req, res) => {
  const result = await authService.revokeSession(req.user.id, req.params.sessionId);
  ApiResponse.ok(res, "Session revoked", result);
};

const listAuthorizedApps = async (req, res) => {
  const apps = await authService.listAuthorizedApps(req.user.id);
  ApiResponse.ok(res, "Authorized apps", apps);
};

const revokeAuthorizedApp = async (req, res) => {
  const result = await authService.revokeAuthorizedApp(req.user.id, req.params.clientId);
  ApiResponse.ok(res, "Consent revoked for this app", result);
};

const imagekitUploadAuth = async (req, res) => {
  const auth = await authService.getImagekitUploadAuth(req.user.id);
  ApiResponse.ok(res, "ImageKit upload auth", auth);
};

export {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  listSessions,
  revokeSession,
  listAuthorizedApps,
  revokeAuthorizedApp,
  imagekitUploadAuth,
};
