import cors from 'cors'
import express from 'express'
import bodyParser from 'body-parser'
import logger from 'winston'
import colors from 'colors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import https from 'https'
import fs from 'fs'
import { ApiServer } from './apiserver'
import { createMiddleware as createPrometheusMiddleware } from '@promster/express'
import { createServer } from '@promster/server'
import dotenv from 'dotenv'
import { getConfig } from './config'

const config = getConfig()

var methodOverride = require('method-override');
var createError = require('http-errors');
var path = require('path');
var session = require('express-session');
var csrf = require('csurf');
var passport = require('passport');

var SQLiteStore = require('connect-sqlite3')(session);
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');

export function makeHTTPServer(config) {

    const app = express()
    const corsOptions = {
        origin: '*',
        optionsSuccessStatus: 200
    }

    app.locals.pluralize = require('pluralize');

    app.use(cors(corsOptions))
    app.use(cookieParser())
    app.use(morgan(':method :url :status :response-time ms - :res[content-length]'))
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())

    app.use(methodOverride());
    app.use(session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: false,
      store: new SQLiteStore({ db: 'sessions.db', dir: '../var/db' })
    }));

    app.use(csrf());
    app.use(passport.authenticate('session'));

    const server = new ApiServer(config)

    app.use(function(req, res, next) {
      var msgs = req.session.messages || [];
      res.locals.messages = msgs;
      res.locals.hasMessages = !! msgs.length;
      req.session.messages = [];
      next();
    });
    app.use(function(req, res, next) {
      res.locals.csrfToken = req.csrfToken();
      next();
    });

    app.use('/', indexRouter);
    app.use('/', authRouter);

    app.use(function(req, res, next) {
      next(createError(404));
    });

    app.use(function(err, req, res, next) {
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};
      res.status(err.status || 500);
      res.render('error');
    });

    return server.initializeServer()
         .then(() => {})
         .then(() => app)

}
