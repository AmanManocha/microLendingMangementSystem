const InvoiceModel = require("../model/invoiceSchema");
const PaymentLinkModel = require("../model/paymentLinkSchema");
const nodemailer = require("nodemailer");
const path = require("path");

const createPaymentLink = async (req, res) => {
  try {
    const { invoiceNumber } = req.query;
    const invoice = await InvoiceModel.findOne({ invoiceID: invoiceNumber });
    console.log(invoice, "invoice");
    if (!invoice)
      return res
        .status(422)
        .json({ error: "Please enter a valid invoice number." });
    if (invoice?.paymentStatus === "Paid")
      return res
        .status(422)
        .json({ error: "Customer has already made payment for this invoice." });

    const accessToken = await generateAccessToken();
    if (!accessToken)
      return res
        .status(422)
        .json({ error: "Currently, the payment service is not working!" });

    const url = `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`;
    const payload = {
      intent: "CAPTURE",
      application_context: {
        return_url: process.env.PAYPAL_SUCCESS_URL,
        cancel_url: process.env.PAYPAL_ERROR_URL,
      },
      purchase_units: [
        {
          reference_id: invoice?.invoiceID,
          amount: {
            currency_code: "USD",
            value: invoice?.amountDue,
          },
        },
      ],
    };
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
    const responsehandle = await handleResponse(response);
    if (responsehandle?.error)
      return res.status(422).json({ error: responsehandle?.error });

    const result = {
      id: responsehandle.id,
      status: responsehandle.status,
      payment_link: "", // Define payment_link here
    };
    responsehandle.links.map((item) => {
      if (item.rel == "approve" && item.method == "GET")
        result.payment_link = item.href;
    });

    // Save the payment link to MongoDB
    const paymentLink = new PaymentLinkModel({
      invoiceId: invoice.invoiceID,
      paymentLinkId: result.id,
      paymentLink: result.payment_link,
    });
    await paymentLink.save();

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: invoice.customer.email,
      subject: "Payment Link For Payment",
      text: `Your Payment Link ${result.payment_link}`,
    };
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        return res
          .status(422)
          .json({
            success: false,
            message: "Failed to send a payment Link on email",
          });
      }
      return await res
        .status(200)
        .json({
          success: true,
          message: `Payment link sent to the email ${invoice.customer.email}`,
        });
    });

    if (result.payment_link == "")
      return res
        .status(422)
        .json({ error: "Currently, the payment service is not working!" });
  } catch (error) {
    return res.status(422).json({ error: error?.message });
  }
};

const generateAccessToken = async () => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET)
      return null;
    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_CLIENT_SECRET
    ).toString("base64");
    const response = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
      {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    return null;
  }
};

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return jsonResponse;
  } catch (err) {
    const errorMessage = await response.text();
    return { error: errorMessage };
  }
}
const successPayment = async (req, res) => {
  const { token } = req.query;
  const result = await captureOrder(token);
  console.log(result, "result");
  const purchaseUnits = result.response.purchase_units;
  console.log("purchase_units:", purchaseUnits);
  const successViewPath = path.join(__dirname, "../views/Payment/success");
  const errorViewPath = path.join(__dirname, "../views/Payment/error");

  if (result.success != true)
    return res.render(errorViewPath, { message: result?.message });

  if (!result?.response?.id)
    return res.render(errorViewPath, {
      message: "The payment link has expired, and no payment can be made",
    });

  if (result?.response?.purchase_units[0]?.reference_id) {
    let invoiceNumber = result?.response?.purchase_units[0]?.reference_id;
    console.log(invoiceNumber);
    const invoice = await InvoiceModel.findOneAndUpdate(
      { invoiceID: invoiceNumber },
      { paymentStatus: "paid" },
      { new: true }
    );
    console.log(invoiceNumber, "uuus", invoice);
    return res.render(successViewPath, {
      message: `Payment of $${invoice?.amountDue} for InvoiceModel #${invoice?.invoiceID} completed successfully.`,
    });
  }
  return res.render(errorViewPath, {
    message: "The payment link has expired, and no payment can be made",
  });
};

const captureOrder = async (token) => {
  let orderID = token;
  const base = process.env.PAYPAL_BASE_URL;
  const accessToken = await generateAccessToken();
  if (!accessToken)
    return res
      .status(422)
      .json({ error: "Currently, payment service is not working!" });
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const responsehandle = await handleResponse(response);
  if (responsehandle?.error)
    return { success: false, message: responsehandle?.error };
  return { success: true, response: responsehandle };
};
const errorPayment = async (req, res) => {
  return res.send(
    `<center><h3>The payment link has expired, and no payment can be made</h3></center>`
  );
};
module.exports = {
  createPaymentLink,
  captureOrder,
  successPayment,
  errorPayment,
};
