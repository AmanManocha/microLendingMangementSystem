const jwt = require('jsonwebtoken');
const { secret } = require('../config');

 const verifyToken = (req, res, next) => {
    const token = req.header('accessToken');
  
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
  
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      req.user   = decoded;
      next();
    });
  }

module.exports=verifyToken