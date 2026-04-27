import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class CreateProjectDto extends BaseDto {
  static schema = Joi.object({
    name: Joi.string().trim().min(1).max(120).required(),
    description: Joi.string().trim().max(2000).allow("").optional(),
    companyName: Joi.string().trim().max(200).allow("").optional(),
    supportEmail: Joi.string().trim().email().max(320).allow("").optional(),
    agreedPolicies: Joi.boolean().valid(true).required().messages({
      "any.required": "You must confirm project policies to continue.",
      "any.only": "You must confirm project policies to continue.",
    }),
  });
}

export default CreateProjectDto;
