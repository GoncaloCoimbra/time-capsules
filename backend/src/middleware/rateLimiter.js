const rateLimit = require('express-rate-limit');

// Rate limiter para autenticação 
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, 
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Ignorar rate limit em desenvolvimento
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Rate limiter para API 
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  // Ignorar rate limit em desenvolvimento
  skip: (req) => process.env.NODE_ENV === 'development'
});

module.exports = { authLimiter, apiLimiter };