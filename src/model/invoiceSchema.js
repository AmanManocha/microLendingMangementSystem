const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
 invoiceID: { type: String, unique: true},
  customer: {
    customerID: { type: String, required: true },
    name: { type: String, required: true },
    contactDetails: { type: String },
    email: { type: String }
  },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  amountDue: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['paid', 'unpaid'] },
  totalAmount: { type: Number },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Invoices = mongoose.model('invoices', invoiceSchema);

module.exports = Invoices;
