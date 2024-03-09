const stripe = require('stripe')('sk_test_51Os1miSHUhwgXxtuZMJ5qZwQhqftBebw3y7T0H7JBNhW40Po4IY6ppzPE6gL0SiHmyZT9DGOBrJN7EE6HZ8NTmBf00uQ0ClVt0');

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_0e125f93bcb5914f362c345584bae221ec7249053e5fedb36354fbb0ab98ee36";

const generatePaymentLinks = async(req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'INR',
            product_data: {
              name: 'Invoice Payment',
            },
            unit_amount: 1000, // Amount in cents (adjust based on your invoice amount)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://yourdomain.com/success', // Redirect URL after successful payment
      cancel_url: 'https://yourdomain.com/cancel', // Redirect URL after canceled payment
    });
    const paymentLink = session.url;

    res.json({ id: session.id , paymentLink});
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
