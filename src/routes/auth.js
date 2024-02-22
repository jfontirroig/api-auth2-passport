import dotenv from 'dotenv'

var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
var FacebookStrategy = require('passport-facebook');
var TwitterStrategy = require('passport-twitter-oauth2.0')
var GitHubStrategy = require('passport-github2').Strategy;
var DiscordStrategy = require('passport-discord').Strategy;

var db = require('../db');

import { getConfig } from '../config'

const config = getConfig()

function jitProvision(provider, profile, cb) {
  db.get('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
    provider,
    profile.id
  ], function(err, row) {
    if (err) { return cb(err); }
    if (!row) {
      db.run('INSERT INTO users (name) VALUES (?)', [
        profile.displayName
      ], function(err) {
        if (err) { return cb(err); }
        var id = this.lastID;
        db.run('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
          id,
          provider,
          profile.id
        ], function(err) {
          if (err) { return cb(err); }
          var user = {
            id: id,
            name: profile.displayName
          };
          return cb(null, user);
        });
      });
    } else {
      db.get('SELECT * FROM users WHERE id = ?', [ row.user_id ], function(err, row) {
        if (err) { return cb(err); }
        if (!row) { return cb(null, false); }
        return cb(null, row);
      });
    }
  });
}

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api-oauth2-passport/oauth2/redirect/google',
    scope: ['profile']
  },
    function verify(issuer, profile, cb) {
      return jitProvision(issuer, profile, cb);
    })
);

passport.use(new FacebookStrategy({
    clientID: config.FACEBOOK_CLIENT_ID,
    clientSecret: config.FACEBOOK_CLIENT_SECRET,
    callbackURL: '/api-oauth2-passport/oauth2/redirect/facebook',
    state: true
  },
    function verify(accessToken, refreshToken, profile, cb) {
      return jitProvision('https://www.facebook.com', profile, cb);
    })
);

passport.use(new GitHubStrategy({
    clientID: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
    callbackURL: "/api-oauth2-passport/oauth2/redirect/github"
  },
    function(accessToken, refreshToken, profile, done) {
      User.findOrCreate({ githubId: profile.id }, function (err, user) {
        return done(err, user);
      });
    })
);

passport.use(new TwitterStrategy({
    clientID: config.TWITTER_CONSUMER_KEY,
    clientSecret: config.TWITTER_CONSUMER_SECRET,
    clientType: 'confidential',
    pkce: true,
    state: true,
    callbackURL: "/api-oauth2-passport/oauth2/redirect/twitter",
    scope: ['offline.access'],
  },
    function (accessToken, refreshToken, profile, done) {
        User.findOrCreate({ twitterId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    })
);

passport.use(new DiscordStrategy({
    clientID: config.DISCORD_CLIENT_ID,
    clientSecret: config.DISCORD_CLIENT_SECRET,
    callbackURL: "/api-oauth2-passport/oauth2/redirect/discord",
    scope: ['identify', 'email', 'guilds', 'guilds.join']
  },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ discordId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    })
);

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

var router = express.Router();

router.get('/api-oauth2-passport/login', function(req, res, next) {
  //res.render('login');
  res.redirect('https://idp.xck.app');
});

router.get('/api-oauth2-passport/login/federated/google', passport.authenticate('google'));

router.get('/api-oauth2-passport/oauth2/redirect/google', passport.authenticate('google', {
  successReturnToOrRedirect: '/api-oauth2-passport/login/',
  failureRedirect: '/api-oauth2-passport/oauth2/login'
}));

router.get('/api-oauth2-passport/login/federated/facebook', passport.authenticate('facebook'));

router.get('/api-oauth2-passport/oauth2/redirect/facebook', passport.authenticate('facebook', {
  successReturnToOrRedirect: '/api-oauth2-passport/login/',
  failureRedirect: '/api-oauth2-passport/login'
}));

router.get('/api-oauth2-passport/login/federated/github', passport.authenticate('github', { scope: [ 'user:email' ] }));

router.get('/api-oauth2-passport/oauth2/redirect/github', passport.authenticate('github', {
  failureRedirect: '/api-oauth2-passport/login' }),
  function(req, res) {
    res.redirect('/api-oauth2-passport/login');
  }
);

router.get('/api-oauth2-passport/login/federated/twitter', passport.authenticate('twitter'));

router.get('/api-oauth2-passport/oauth2/redirect/twitter', passport.authenticate('twitter', {
  successReturnToOrRedirect: '/api-oauth2-passport/',
  failureRedirect: '/api-oauth2-passport/login'
}));

router.get('/api-oauth2-passport/login/federated/discord', passport.authenticate('discord'));

router.get('/api-oauth2-passport/oauth2/redirect/discord', passport.authenticate('discord', {
    failureRedirect: '/api-oauth2-passport/login'}),
    function(req, res) {
      res.redirect('/api-oauth2-passport/login')
    }
);

router.post('/api-oauth2-passport/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('https://idp.xck.app');
  });
});

module.exports = router;
