const Joi = require("joi");

const Schema = {
  UserSignUP: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),
  UserSignIn: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
  createInvoice: Joi.object({
    invoiceID: Joi.string(),
    customer: Joi.object({
      customerID: Joi.string().required(),
      name: Joi.string().required(),
      contactDetails: Joi.string(),
      email: Joi.string().email(),
    }),
    invoiceDate: Joi.date().required(),
    dueDate: Joi.date().required(),
    amountDue: Joi.number().required(),
    paymentStatus: Joi.string().valid("paid", "unpaid"),
    totalAmount: Joi.number(),
    createdBy: Joi.string(),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
  }),
};

module.exports = Schema;
