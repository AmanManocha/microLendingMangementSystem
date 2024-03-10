const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware')
const { signIn, signUp, createInvoice, getAllInvoice, searchInvoice, filterInvoice, generatePaymentLinkNew, proceessPayment} = require('../controller/index')
const { addUserSignInValidation, addUserSignUpValidation, addInvoiceValidation} = require('../validations/userValidation');

router.post('/signUp', addUserSignUpValidation, signUp)
router.post('/signIn', addUserSignInValidation, signIn )
router.post('/createInvoice', addInvoiceValidation, verifyToken, createInvoice)
router.get('/getAllInvoice', verifyToken, getAllInvoice)
router.get('/searchInvoice', verifyToken, searchInvoice);
router.get('/filterInvoice', verifyToken, filterInvoice)
router.post('/generatePaymentLinks',verifyToken, generatePaymentLinkNew);

router.post('/webhook', proceessPayment);

module.exports = { userRoutes: router };
