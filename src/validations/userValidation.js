const {UserSignUP, UserSignIn} = require('./userSchema')

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
    addJobDetailsValidation: (req, res, next) => {
        const value = jobDetails.validate(req.body);
        if (value.error) return next(res.status(400).send({message:value.error.details[0].message}));
           next()
    },
}