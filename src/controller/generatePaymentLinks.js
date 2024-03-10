const Invoices = require('../model/invoiceSchema');
const paymentLink = require('../model/paymentLinkSchema');
const stripe = require('stripe')('sk_test_51Os1miSHUhwgXxtuZMJ5qZwQhqftBebw3y7T0H7JBNhW40Po4IY6ppzPE6gL0SiHmyZT9DGOBrJN7EE6HZ8NTmBf00uQ0ClVt0');

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_0e125f93bcb5914f362c345584bae221ec7249053e5fedb36354fbb0ab98ee36";


const createPaymentLink = async ( req, res) => {

  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 1000,
    recurring: {
      interval: 'month',
    },
    product_data: {
      name: 'Gold Plan',
    },
  });
}

const generatePaymentLinks = async(req, res) => {
  try {
    const { invoiceID } = req.body; // Assuming you receive the invoice number in the request body

    // Fetch the invoice details from the database
    const invoice = await Invoices.findOne({ invoiceID});

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    const expirationTime = Math.floor(Date.now() / 1000) + (30 * 60);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'INR',
            product_data: {
              name: 'Invoice Payment',
            },
            unit_amount: invoice.amountDue * 100, // Amount in cents (adjust based on your invoice amount)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: 'IN',
      customer_email: invoice.customer.email,
      success_url: 'https://yourdomain.com/success', // Redirect URL after successful payment
      cancel_url: 'https://yourdomain.com/cancel', // Redirect URL after canceled payment
      expires_at: expirationTime, // Set the expiration time
    });
    const newPaymentLink = new paymentLink({
      sessionId: session.id,
      paymentLink: session.url,
    });

    await newPaymentLink.save();

    res.json({message: ': A unique payment link is created for the invoice', id: session.id , paymentLink: session.url});
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};


const proceessPayment = async(req, res) => {
  try {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(res.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    console.log(`Unhandled event type ${event.type}`);

    // Return a 200 response to acknowledge receipt of the event
    return res.json({ message: 'Success payment' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

module.exports= {
  generatePaymentLinks,
  proceessPayment,
}
