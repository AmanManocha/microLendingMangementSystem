const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware')
const { signIn, signUp, createInvoice, getAllInvoice, searchInvoice, filterInvoice} = require('../controller/index')
const { addUserSignInValidation, addUserSignUpValidation, addInvoiceValidation} = require('../validations/userValidation');
const { createPaymentLink, successPayment, errorPayment } = require('../controller/generatePaymentLinks');

router.post('/signUp', addUserSignUpValidation, signUp)
router.post('/signIn', addUserSignInValidation, signIn )
router.post('/createInvoice', addInvoiceValidation, verifyToken, createInvoice)
router.get('/getAllInvoice', verifyToken, getAllInvoice)
router.get('/searchInvoice', verifyToken, searchInvoice);
router.get('/filterInvoice', verifyToken, filterInvoice)
router.post('/generatePaymentLinks',verifyToken, createPaymentLink);
router.route('/success-payment').get(successPayment)
router.route('/error-payment').get(errorPayment)

module.exports = { userRoutes: router };
