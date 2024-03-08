const jwt = require('jsonwebtoken');

 const generateToken = (user) => {
    return jwt.sign({ userId: user._id, email: user.email}, 'your-secret-key', {
      expiresIn: '1h', // Token expiration time (adjust as needed)
    });
  };

  module.exports = generateToken;