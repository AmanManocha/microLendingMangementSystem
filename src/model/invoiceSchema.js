const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
 invoiceID: { type: String, unique: true},
//   customer: {
//     customerID: { type: String, required: true },
//     name: { type: String, required: true },
//     contactDetails: { type: String }
//   },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  amountDue: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['paid', 'unpaid'], required: true },
//   billingAddress: { type: String },
//   shippingAddress: { type: String },
//   itemDetails: [{
//     itemID: { type: String, required: true },
//     itemName: { type: String, required: true },
//     quantity: { type: Number, required: true },
//     unitPrice: { type: Number, required: true },
//     totalPrice: { type: Number, required: true }
//   }],
  totalAmount: { type: Number },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Invoices = mongoose.model('invoices', invoiceSchema);

module.exports = Invoices;
