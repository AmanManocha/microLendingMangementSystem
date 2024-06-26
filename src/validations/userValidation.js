const {UserSignUP, UserSignIn, createInvoice} = require('./userSchema')

module.exports= {
    addUserSignUpValidation: (req, res, next) => {
        const value = UserSignUP.validate(req.body);
        if (value.error) return next(res.status(400).send({message:value.error.details[0].message}));
           next()
    },
    addUserSignInValidation: (req, res, next) => {
        const value = UserSignIn.validate(req.body);
        if (value.error) return next(res.status(400).send({message:value.error.details[0].message}));
           next()
    },
    addInvoiceValidation: (req, res, next) => {
      const value = createInvoice.validate(req.body);
      if (value.error) return next(res.status(400).send({message:value.error.details[0].message}));
         next()
  },
}
