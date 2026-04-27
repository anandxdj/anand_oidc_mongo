import * as projectService from "./project.service.js";
import * as clientService from "../oauth-client/oauth-client.service.js";
import ApiResponse from "../../common/utils/api-response.js";

const list = async (req, res) => {
  const data = await projectService.listMine(req.user.id);
  ApiResponse.ok(res, "Projects", data);
};

const create = async (req, res) => {
  const data = await projectService.create(req.user.id, req.body);
  ApiResponse.created(res, "Project created", data);
};

const getOne = async (req, res) => {
  const data = await projectService.getMine(req.user.id, req.params.projectId);
  ApiResponse.ok(res, "Project", data);
};

const listClients = async (req, res) => {
  const data = await clientService.listByProject(req.user.id, req.params.projectId);
  ApiResponse.ok(res, "OAuth clients", data);
};

const createClient = async (req, res) => {
  const data = await clientService.createForProject(req.user.id, req.params.projectId, req.body);
  ApiResponse.created(
    res,
    "Client created. Store the client secret now — it will not be shown again.",
    data,
  );
};

const getClient = async (req, res) => {
  const data = await clientService.getByProject(
    req.user.id,
    req.params.projectId,
    req.params.clientId,
  );
  ApiResponse.ok(res, "OAuth client", data);
};

const updateClient = async (req, res) => {
  const data = await clientService.updateByProject(
    req.user.id,
    req.params.projectId,
    req.params.clientId,
    req.body,
  );
  ApiResponse.ok(res, "Client updated", data);
};

const rollSecret = async (req, res) => {
  const data = await clientService.rollSecretByProject(
    req.user.id,
    req.params.projectId,
    req.params.clientId,
  );
  ApiResponse.ok(
    res,
    "New client secret issued. Copy it now — it will not be shown again.",
    data,
  );
};

export { list, create, getOne, listClients, createClient, getClient, updateClient, rollSecret };
