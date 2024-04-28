const Invoices = require("../model/invoiceSchema");

const generateInvoiceNumber = async () => {
  try {
    const currentDate = new Date();
    const formattedDate = currentDate
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    const latestInvoice = await Invoices.findOne({
      invoiceID: { $regex: `^${formattedDate}` },
    }).sort({ invoiceID: -1 });

    let newInvoiceNumber;
    if (latestInvoice) {

      const latestNumber = parseInt(latestInvoice.invoiceID.slice(-3));
      const newNumber = latestNumber + 1;
      newInvoiceNumber = `${formattedDate}${newNumber
        .toString()
        .padStart(5, "0")}`;
    } else {
      newInvoiceNumber = `${formattedDate}00001`;
    }

    return newInvoiceNumber;
  } catch (err) {
    console.error("Error generating invoice number:", err);
    throw new Error("Failed to generate invoice number");
  }
};

const createInvoice = async (req, res) => {

  try {
    const invoiceNumber = await generateInvoiceNumber();
    console.log("invoiceNumber :", invoiceNumber);
    const { customerID, name, contactDetails, email } = req.body.customer;
    const newInvoice = new Invoices({
      ...req.body, // Include other data from request body
      customer: {
        customerID,
        name,
        contactDetails,
        email,
      },
      invoiceID: invoiceNumber,
      paymentStatus: "unpaid",
    });
    const savedInvoice = await newInvoice.save();
    res.status(200).json({
      message: `Invoice #${invoiceNumber} was created successfully.`,
      invoice: savedInvoice,
    });
  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(400).json({ message: "Failed to create invoice", error: err });
  }
};

const getAllInvoice = async (req, res) => {
  try {
    const invoices = await Invoices.find({});
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

const searchInvoice = async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm;
    const queryObject = {};

    if (searchTerm) {
      queryObject.$or = [
        { invoiceID: { $regex: searchTerm, $options: "i" } },
        { "customer.name": { $regex: searchTerm, $options: "i" } },
        { "customer.customerID": { $regex: searchTerm, $options: "i" } },
        { "customer.contactDetails": { $regex: searchTerm, $options: "i" } },
        { "customer.email": { $regex: searchTerm, $options: "i" } },
      ];
    }

    const invoices = await Invoices.find(queryObject);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

const filterInvoice = async (req, res) => {
  try {
    const paymentStatus = req.query.paymentStatus;

    let queryObject = {};
    if (paymentStatus === "paid" || paymentStatus === "unpaid") {
      queryObject.paymentStatus = paymentStatus;
    } else if (paymentStatus !== undefined && paymentStatus !== null) {
      return res.status(400).json({ message: "Invalid filter value" });
    }

    const invoices = await Invoices.find(queryObject);

    res.json(invoices);
  } catch (err) {
    // Handle errors
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

module.exports = { createInvoice, getAllInvoice, searchInvoice, filterInvoice };
