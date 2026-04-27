import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import ApiError from "./common/utils/api-error.js";
import authRoute from "./modules/auth/auth.routes.js";
import projectRoutes from "./modules/project/project.routes.js";
import oauthApiRoutes from "./modules/oauth/oauth-api.routes.js";
import oauthRoutes from "./modules/oauth/oauth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import { getOpenIdConfiguration } from "./modules/oauth/oidc-discovery.controller.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: "ok",
    database: dbOk ? "connected" : "disconnected",
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get("/.well-known/openid-configuration", getOpenIdConfiguration);

app.use("/api/auth", authRoute);
app.use("/api/oauth", oauthApiRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/oauth", oauthRoutes);

app.all("{*path}", (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";
  if (status === 500) {
    console.error(err);
  }
  return res.status(status).json({
    success: false,
    message,
  });
});

export default app;
