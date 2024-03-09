const stripe = require('stripe')('sk_test_51Os1miSHUhwgXxtuZMJ5qZwQhqftBebw3y7T0H7JBNhW40Po4IY6ppzPE6gL0SiHmyZT9DGOBrJN7EE6HZ8NTmBf00uQ0ClVt0');


const generatePaymentLinks = async(req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
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
}

module.exports= {generatePaymentLinks}
