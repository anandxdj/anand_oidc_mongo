import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class CreateClientDto extends BaseDto {
  static schema = Joi.object({
    clientName: Joi.string().trim().min(1).max(120).required(),
    redirectUris: Joi.array()
      .items(Joi.string().uri().required())
      .min(1)
      .required(),
    description: Joi.string().trim().max(2000).allow("").optional(),
    logoUrl: Joi.string().uri().allow("").optional(),
    /** Optional when using deprecated POST /api/clients; ignored for POST /api/projects/:id/clients */
    projectId: Joi.string().hex().length(24).optional(),
  });
}

export default CreateClientDto;
