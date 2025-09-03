const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign(
    { id }, // payload
    process.env.JWT_SECRET, // secret key from .env
    { expiresIn: '30d' } // token validity
  );
};

module.exports = generateToken;
