const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
const auth = require('../middleware/auth');
router.patch('/profile', auth, authController.updateProfile);

// Current user
router.get('/me', auth, authController.me);

const passport = require('passport');
const jwt = require('jsonwebtoken');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login`, session: false }), (req, res) => {
  const user = req.user;
  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login`, session: false }), (req, res) => {
  const user = req.user;
  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
});

// Diagnostic: returns which OAuth strategies are active (safe, no secrets)
router.get('/config', (req, res) => {
  res.json({
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    githubCallback: process.env.GITHUB_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`,
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    googleCallback: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  });
});

module.exports = router;
