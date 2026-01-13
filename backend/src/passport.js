const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  console.log('Passport: registering GitHub strategy');
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || `${BACKEND_URL}/api/auth/github/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
      let user = await User.findOne({ where: { provider: 'github', providerId: profile.id } });
      if (!user && email) user = await User.findOne({ where: { email } });

      if (!user) {
        user = await User.create({
          username: profile.username || profile.displayName || `gh-${profile.id}`,
          email: email || `github+${profile.id}@noemail.local`,
          provider: 'github',
          providerId: profile.id,
          password: null,
          avatar: (profile.photos && profile.photos[0] && profile.photos[0].value) || null
        });
      } else {
        user.provider = 'github';
        user.providerId = profile.id;
        if (!user.avatar && profile.photos && profile.photos[0]) user.avatar = profile.photos[0].value;
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
} else {
  console.warn('Passport: GitHub strategy NOT registered (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)');
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Passport: registering Google strategy');
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
      let user = await User.findOne({ where: { provider: 'google', providerId: profile.id } });
      if (!user && email) user = await User.findOne({ where: { email } });

      if (!user) {
        user = await User.create({
          username: profile.displayName || `google-${profile.id}`,
          email: email || `google+${profile.id}@noemail.local`,
          provider: 'google',
          providerId: profile.id,
          password: null,
          avatar: (profile.photos && profile.photos[0] && profile.photos[0].value) || null
        });
      } else {
        user.provider = 'google';
        user.providerId = profile.id;
        if (!user.avatar && profile.photos && profile.photos[0]) user.avatar = profile.photos[0].value;
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
} else {
  console.warn('Passport: Google strategy NOT registered (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
}

module.exports = passport;