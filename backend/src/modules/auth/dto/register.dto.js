import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class RegisterDto extends BaseDto {
  static schema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string()
      .min(8)
      .pattern(/(?=.*[A-Z])(?=.*\d)/)
      .message(
        "Password must contain at least one uppercase letter and one digit",
      )
      .required(),
    role: Joi.string().valid("customer", "seller").default("customer"),
    termsAccepted: Joi.boolean().valid(true).required(),
    country: Joi.string().trim().length(2).uppercase().allow("").optional(),
  });
}

export default RegisterDto;
