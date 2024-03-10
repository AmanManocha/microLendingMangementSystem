const mongoose = require('mongoose');

const paymentLinkSchema = new mongoose.Schema({
  paymentLink: { type: String, required: true, unique: true , index: true},
  sessionId: { type: String, required: true }
});

const paymentLink = mongoose.model('paymentLink', paymentLinkSchema);

module.exports = paymentLink;
