import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Angel One API Configuration
  ANGEL_FETCH_MCX_TOKEN: Joi.string().required(),
  API_KEY: Joi.string().required(),
  ANGEL_ONE_URL: Joi.string().required(),
  
  // Authentication
  CLIENT_CODE: Joi.string().required(),
  MPIN: Joi.string().required(),
  TOTP_SECRET: Joi.string().required(),

  // Gold Purity Ratios
  GOLD_22_PURITY_RATIO: Joi.number().default(0.89),
  GOLD_18_PURITY_RATIO: Joi.number().default(0.76),

  // Optional Configuration
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
}); 