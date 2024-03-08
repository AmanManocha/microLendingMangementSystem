const Joi = require('joi');

const Schema = {
    UserSignUP: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().min(8).required(),
    }),
    UserSignIn: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
    }),
   
}

module.exports = Schema;