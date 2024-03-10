
const InvoiceModel = require('../model/invoiceSchema');
const PaymentLinkModel = require('../model/paymentLinkSchema');
const stripe = require('stripe')('sk_test_PB9cdDyLN5BTQKThWRRuEMB200bR4cecpU');

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_0e125f93bcb5914f362c345584bae221ec7249053e5fedb36354fbb0ab98ee36";


const generatePaymentLinkNew = async (req, res, next) => {
  try {

    const { invoiceId } = req.body; // Assuming you receive the invoice number in the request body

    // Fetch the invoice details from the database
    const invoice = await InvoiceModel.findOne({ invoiceID: invoiceId  });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const expirationTime = Math.floor(Date.now() / 1000) + (30 * 60);

    // generate price
    const price = await stripe.prices.create({
      currency: 'inr',
      unit_amount: invoice.amountDue * 100,
      product_data: {
        name: 'Gold Plan',
      },
    })
    console.log('price', price)
    if (!price) throw new Error('Something went wrong')

    // generate payment link
    const priceId = price.id

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    });

    console.log('paymentLink', paymentLink)
    if (!paymentLink) throw new Error('someting went wrong')

    const payload = {
      invoiceId,
      paymentLinkId: paymentLink.id,
      paymentLink: paymentLink.url,
      expires: expirationTime, // Set the expiration time
    }

    const newPaymentLink = new PaymentLinkModel(payload);

    console.log('newpaylink', newPaymentLink);

    return res.status(200).json({ data: payload })

  } catch (error) {
    console.log('error', error)
    res.status(500).send('Server Error');
  }
}


const proceessPayment = async (req, res) => {
  try {
    console.log('api called')
    const sig = req.headers['stripe-signature'];

    let event = req.body
    console.log('event.type', event.type)
    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':

          console.log('going for checkout.session.completed')
          const checkoutCompleted = event.data.object;
          console.log('checkoutCompleted', checkoutCompleted)
          const paymentLink = checkoutCompleted.payment_link

          // serach payment link in database
          const paymentDetails = await PaymentLinkModel.findOne({ paymentLink })
          if (!paymentDetails) throw new Error('no payment details found')

          // update the invoice status to be paid for invoice id
          const invoiceId = paymentDetails.invoiceId

          const result = await InvoiceModel.udpate({ invoiceID: invoiceId }, { paymentStatus: 'paid' })

          return res.status(200).json({ message: 'invoice marked paid successfully' })

          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

    } catch (err) {
      console.log('in error', err)
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

module.exports = {
  proceessPayment,
  generatePaymentLinkNew
}
