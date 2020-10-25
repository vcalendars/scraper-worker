import Joi from 'joi';

const configurationSchema = Joi.object({
  targets: Joi.array().items(
    Joi.object({
      url: Joi.string().required(),
      scraperName: Joi.string().required(),
      options: Joi.object(),
    }),
  ),
});

export default configurationSchema;
