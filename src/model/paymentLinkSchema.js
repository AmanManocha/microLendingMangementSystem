const mongoose = require('mongoose');

const paymentLinkSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true, index: true },
  paymentLinkId: { type: String, required: true, unique: true, index: true },
  paymentLink: { type: String, required: true, unique: true, index: true },
});

const paymentLink = mongoose.model('paymentLink', paymentLinkSchema);

module.exports = paymentLink;
