const jwt = require('jsonwebtoken');
const { secret } = require('../config');

 const generateToken = (user) => {
    return jwt.sign({ userId: user._id, email: user.email}, secret, {
      expiresIn: '1h',
    });
  };

  module.exports = generateToken;