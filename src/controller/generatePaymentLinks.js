
const InvoiceModel = require('../model/invoiceSchema');
const PaymentLinkModel = require('../model/paymentLinkSchema');
const stripe = require('stripe')('sk_test_PB9cdDyLN5BTQKThWRRuEMB200bR4cecpU');
const  nodemailer = require('nodemailer') 
const path = require('path');
// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_0e125f93bcb5914f362c345584bae221ec7249053e5fedb36354fbb0ab98ee36";

// const generatePaymentLinkNew = async (req, res, next) => {
//   try {

//     const { invoiceId } = req.body; // Assuming you receive the invoice number in the request body

//     // Fetch the invoice details from the database
//     const invoice = await InvoiceModel.findOne({ invoiceID: invoiceId  });
//     if (!invoice) return res.status(404).json({ message: 'InvoiceModel not found' });

//     const expirationTime = Math.floor(Date.now() / 1000) + (30 * 60);

//     // generate price
//     const price = await stripe.prices.create({
//       currency: 'inr',
//       unit_amount: invoice.amountDue * 100,
//       product_data: {
//         name: 'Gold Plan',
//       },
//     })
//     console.log('price', price)
//     if (!price) throw new Error('Something went wrong')

//     // generate payment link
//     const priceId = price.id

//     const paymentLink = await stripe.paymentLinks.create({
//       line_items: [
//         {
//           price: priceId,
//           quantity: 1,
//         },
//       ],
//     });

//     console.log('paymentLink', paymentLink)
//     if (!paymentLink) throw new Error('someting went wrong')

//     const payload = {
//       invoiceId,
//       paymentLinkId: paymentLink.id,
//       paymentLink: paymentLink.url,
//       expires: expirationTime, // Set the expiration time
//     }

//     const newPaymentLink = new PaymentLinkModel(payload);

//     console.log('newpaylink', newPaymentLink);

//     return res.status(200).json({ data: payload })

//   } catch (error) {
//     console.log('error', error)
//     res.status(500).send('Server Error');
//   }
// }


// const proceessPayment = async (req, res) => {
//   try {
//     console.log('api called')
//     const sig = req.headers['stripe-signature'];

//     let event = req.body
//     console.log('event.type', event.type)
//     try {
//       // Handle the event
//       switch (event.type) {
//         case 'checkout.session.completed':

//           console.log('going for checkout.session.completed')
//           const checkoutCompleted = event.data.object;
//           console.log('checkoutCompleted', checkoutCompleted)
//           const paymentLink = checkoutCompleted.payment_link

//           // serach payment link in database
//           const paymentDetails = await PaymentLinkModel.findOne({ paymentLink })
//           if (!paymentDetails) throw new Error('no payment details found')

//           // update the invoice status to be paid for invoice id
//           const invoiceId = paymentDetails.invoiceId

//           const result = await InvoiceModel.udpate({ invoiceID: invoiceId }, { paymentStatus: 'paid' })

//           return res.status(200).json({ message: 'invoice marked paid successfully' })

//           break;
//         // ... handle other event types
//         default:
//           console.log(`Unhandled event type ${event.type}`);
//       }

//     } catch (err) {
//       console.log('in error', err)
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     // Handle the event
//     console.log(`Unhandled event type ${event.type}`);

//     // Return a 200 response to acknowledge receipt of the event
//     return res.json({ message: 'Success payment' });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send('Server Error');
//   }
// }


 const createPaymentLink = async (req, res) => {
  try {
    const { invoiceNumber } = req.query;
    const invoice = await InvoiceModel.findOne({invoiceID:invoiceNumber});
    console.log(invoice,'invoice')
    if (!invoice) return res.status(422).json({ error: 'Please enter valid invoice number.' });
    if (invoice?.paymentStatus==='Paid') return res.status(422).json({ error: 'Customer has already made payment for this invoice.' });

    const accessToken = await generateAccessToken();
    if (!accessToken) return res.status(422).json({ error: 'Currently, payment service is not working!' })
    
    const url = `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`;
    const payload = {
        intent: "CAPTURE",
        application_context: {
          return_url: process.env.PAYPAL_SUCCESS_URL,
          cancel_url: process.env.PAYPAL_ERROR_URL,
        },
        purchase_units: [{
          reference_id: invoice?.invoiceID,
          amount: {
              currency_code: "USD",
              value: invoice?.amountDue,
          }
        }],
    };
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });
    const responsehandle = await handleResponse(response)
    if (responsehandle?.error) return res.status(422).json({ error: responsehandle?.error })

    const result = {
      id:responsehandle.id,
      status:responsehandle.status,
      payment_link:''
    }
    responsehandle.links.map(item=>{
      if(item.rel=='approve' && item.method == 'GET') result.payment_link = item.href
    })
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
          user: process.env.SMTP_EMAIL, 
          pass: process.env.SMTP_PASSWORD,
      }
    });
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: invoice.customer.email,
      subject: 'Payment Link For Payment ',
      text: `Your Payment Link ${result.payment_link}`,
    };
    transporter.sendMail(mailOptions,async (error, info) => {
      if (error) {
        return res.status(422).json({ success: false, message: 'Failed to send a payment Link on email' });
      }
      return await res.status(200).json({ success: true, message: `Payment link send on the mail ${invoice.customer.email}`});

    });
    if (result.payment_link == '') return res.status(422).json({ error: 'Currently, payment service is not working!' })
  } catch(error) {
    return res.status(422).json({error: error?.message});
  }
};

const generateAccessToken = async () => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return null
    const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_CLIENT_SECRET).toString("base64")
    const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
          Authorization: `Basic ${auth}`,
        },
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    return null
  }
};

async function handleResponse(response) {
    try {
        const jsonResponse = await response.json();
        return jsonResponse
    } catch (err) {
        const errorMessage = await response.text();
        return { error: errorMessage }
    }
}
 const successPayment = async (req, res) => {
  const {token} =req.query
  const result = await captureOrder(token)
  console.log(result, "result")
  const purchaseUnits = result.response.purchase_units;
  console.log('purchase_units:', purchaseUnits);
  const successViewPath = path.join(__dirname, '../views/Payment/success');
  const errorViewPath = path.join(__dirname, '../views/Payment/error');

  if(result.success!=true) return res.render(errorViewPath,{ message: result?.message });

  if(!result?.response?.id) return res.render(errorViewPath, { message: 'The payment link has expired, and no payment can be made' });
  
  if(result?.response?.purchase_units[0]?.reference_id) {
      let invoiceNumber = result?.response?.purchase_units[0]?.reference_id
      console.log(invoiceNumber)
      const invoice = await InvoiceModel.findOneAndUpdate(
          {invoiceID:invoiceNumber},
          {paymentStatus: 'Paid'},
          {new:true}
      );
      console.log(invoiceNumber,"uuus",invoice)
      return res.render(successViewPath, { message: `Payment of $${invoice?.amountDue} for InvoiceModel #${invoice?.invoiceID} completed successfully.` });
  }
  return res.render(errorViewPath,{ message: 'The payment link has expired, and no payment can be made' });
};

 const captureOrder = async (token) => {
  let orderID=token
  const base = process.env.PAYPAL_BASE_URL;
  const accessToken = await generateAccessToken();
  if (!accessToken) return res.status(422).json({ error: 'Currently, payment service is not working!' })
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;
  const response = await fetch(url, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
      }
  });

  const responsehandle = await handleResponse(response)
  if(responsehandle?.error) return { success:false, message: responsehandle?.error }
  return {success: true, response: responsehandle}
};
const errorPayment = async (req, res) => {
  return res.send(`<center><h3>The payment link has expired, and no payment can be made</h3></center>`);
};
module.exports = {
 createPaymentLink,
 captureOrder,
 successPayment,
 errorPayment
}