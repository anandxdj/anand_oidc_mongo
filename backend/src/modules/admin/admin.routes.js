import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import SuspendClientDto from "./dto/suspend-client.dto.js";
import * as ctrl from "./admin.controller.js";

const router = Router();

router.use(authenticate, authorize("admin", "superadmin"));

router.get("/stats", ctrl.stats);
router.get("/apps", ctrl.listApps);
router.get("/apps/:clientId", ctrl.getApp);
router.patch("/apps/:clientId", validate(SuspendClientDto), ctrl.patchApp);
router.get("/users", ctrl.listUsers);
router.get("/users/:userId/authorized-apps", ctrl.userAuthorizedApps);
router.delete("/users/:userId/consents/:clientId", ctrl.revokeConsent);

export default router;
