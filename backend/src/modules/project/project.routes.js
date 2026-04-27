import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import CreateProjectDto from "./dto/create-project.dto.js";
import CreateClientDto from "../oauth-client/dto/create-client.dto.js";
import UpdateClientDto from "../oauth-client/dto/update-client.dto.js";
import * as controller from "./project.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.list);
router.post("/", validate(CreateProjectDto), controller.create);
router.get("/:projectId", controller.getOne);

router.get("/:projectId/clients", controller.listClients);
router.post("/:projectId/clients", validate(CreateClientDto), controller.createClient);
router.get("/:projectId/clients/:clientId", controller.getClient);
router.patch("/:projectId/clients/:clientId", validate(UpdateClientDto), controller.updateClient);
router.post("/:projectId/clients/:clientId/roll-secret", controller.rollSecret);

export default router;
