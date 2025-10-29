const jwt = require('jsonwebtoken');

// JWT Secret (should match the one in auth.js)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Middleware to authenticate JWT tokens
 * Adds user data to req.user if token is valid
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    // Verify token
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Add user data to request
    next(); // Continue to route handler
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authenticateToken;
