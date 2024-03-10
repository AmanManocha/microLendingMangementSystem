const Invoices = require("../model/invoiceSchema");

const generateInvoiceNumber = async () => {
    try {
        // Get the current date
        const currentDate = new Date();

        // Format the date as YYYYMMDD (e.g., 20220307 for March 7, 2022)
        const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');

        // Find the latest invoice number in the database that starts with the current date
        const latestInvoice = await Invoices.findOne({ invoiceID: { $regex: `^${formattedDate}` } })
            .sort({ invoiceID: -1 });

        let newInvoiceNumber;
        if (latestInvoice) {
            // Extract the numeric part of the latest invoice number
            const latestNumber = parseInt(latestInvoice.invoiceID.slice(-3));
            // Increment the number by 1
            const newNumber = latestNumber + 1;
            // Pad the number with leading zeros if necessary (e.g., 001, 002, ...)
            newInvoiceNumber = `${formattedDate}${newNumber.toString().padStart(5, '0')}`;
        } else {
            // If no invoice exists for the current date, start from 001
            newInvoiceNumber = `${formattedDate}00001`;
        }

        return newInvoiceNumber;
    } catch (err) {
        console.error('Error generating invoice number:', err);
        throw new Error('Failed to generate invoice number');
    }
};


const createInvoice = async (req, res) => {
    // const requestBody = req.body;
    // return res.status(200).json({ requestBody });

    try {
        // Generate a unique invoice number
        const invoiceNumber = await generateInvoiceNumber();
        console.log('invoiceNumber :', invoiceNumber);
        const { customerID, name, contactDetails, email } = req.body.customer;
        // Create new invoice using data from request body and generated invoice number
        const newInvoice = new Invoices({
            ...req.body, // Include other data from request body
            customer: {
              customerID,
              name,
              contactDetails,
              email
          },
            invoiceID: invoiceNumber,

        });
        // Save invoice to database
        const savedInvoice = await newInvoice.save();
        res.status(200).json({
          message: `Invoice #${invoiceNumber} was created successfully.`,
          invoice: savedInvoice});
    }
    catch(err){
        console.error('Error creating invoice:', err);
        res.status(400).json({ message: 'Failed to create invoice', error: err });
    }
};

const getAllInvoice = async (req, res) => {
    try {
        const invoices = await Invoices.find({});
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err });
    }

};

const searchInvoice = async (req, res) => {
    try {
        // Extract query parameters from the request
        const invoiceID = req.query.invoiceID;
        const customerName = req.query.customerName;

        // Create a MongoDB query object to search by invoice ID and/or customer name
        const queryObject = {};

        // If the invoiceID parameter is present, search by invoice ID
        if (invoiceID) {
            queryObject.invoiceID = invoiceID;
        }

        // If the customerName parameter is present, search by customer name
        if (customerName) {
            queryObject['customer.name'] = customerName;
        }

        // Find invoices matching the query object
        const invoices = await Invoices.find(queryObject);

        // Respond with the found invoices
        res.json(invoices);
    } catch (err) {
        // Handle errors
        res.status(500).json({ message: 'Internal server error', error: err });
    }
};

const filterInvoice = async (req, res) => {
    try {
        const paymentStatus = req.query.paymentStatus;

        // Initialize the query object
        let queryObject = {};

        // Implement filtering logic based on the payment status
        if (paymentStatus === 'paid' || paymentStatus === 'unpaid') {
            queryObject.paymentStatus = paymentStatus;
        } else if (paymentStatus !== undefined && paymentStatus !== null) {
            // If an invalid filter value is provided, return a 400 Bad Request response
            return res.status(400).json({ message: 'Invalid filter value' });
        }

        // Find invoices matching the query object
        const invoices = await Invoices.find(queryObject);

        // Respond with the found invoices
        res.json(invoices);
    } catch (err) {
        // Handle errors
        res.status(500).json({ message: 'Internal server error', error: err });
    }
};

module.exports = {createInvoice, getAllInvoice, searchInvoice, filterInvoice}
