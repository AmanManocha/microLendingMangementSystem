const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware')
const { signIn, signUp, createInvoice, getAllInvoice, searchInvoice, filterInvoice} = require('../controller/index')
const { addUserSignInValidation, addUserSignUpValidation} = require('../validations/userValidation');

router.post('/signUp', addUserSignUpValidation, signUp) 
router.post('/signIn', addUserSignInValidation, signIn )
router.post('/createInvoice', verifyToken, createInvoice)
router.get('/getAllInvoice', verifyToken, getAllInvoice)
router.get('/searchInvoice', verifyToken, searchInvoice);
router.get('/filterInvoice', verifyToken, filterInvoice)

module.exports = { userRoutes: router };