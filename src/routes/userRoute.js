const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware')
const { signIn, signUp, createInvoice, getAllInvoice, searchInvoice, filterInvoice} = require('../controller/index')
const { addUserSignInValidation, addUserSignUpValidation, addInvoiceValidation} = require('../validations/userValidation');
const { generatePaymentLinks, proceessPayment } = require('../controller/generatePaymentLinks');

router.post('/signUp', addUserSignUpValidation, signUp)
router.post('/signIn', addUserSignInValidation, signIn )
router.post('/createInvoice', addInvoiceValidation, verifyToken, createInvoice)
router.get('/getAllInvoice', verifyToken, getAllInvoice)
router.get('/searchInvoice', verifyToken, searchInvoice);
router.get('/filterInvoice', verifyToken, filterInvoice)
router.post('/generatePaymentLinks',verifyToken, generatePaymentLinks);

router.post('/webhook', proceessPayment);

module.exports = { userRoutes: router };
