#!/usr/bin/env node

import winston from 'winston'
import dotenv from 'dotenv'

dotenv.config()

import { makeHTTPServer } from './apihttp'
import { getConfig } from './config'
import https from 'https'
import fs from 'fs'

const config = getConfig()

winston.configure(config.winstonConfig)

if (config.regtest) {
    configureRegtest()
}

if (config.development) {
    initializationPromise = initializationPromise.then(
            (server) => {
                return initializeBlockstackCore()
                    .then(() => server)
            })
        .catch((err) => {
            winston.error(err)
            throw err
        })
}
let initializationPromise = makeHTTPServer(config)
    .catch((err) => {
        winston.error(err)
        throw err
    })

initializationPromise
    .then((server) => {
        // Certificados para https
        const httpsOptions = {
            key: fs.readFileSync('/etc/letsencrypt/live/domains.paradigma.global/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/domains.paradigma.global/fullchain.pem'),
            ca: fs.readFileSync('/etc/letsencrypt/live/domains.paradigma.global/chain.pem')
        }
        winston.info('Server Certificates: privkey: OK, fullchain: OK')
        https.createServer(httpsOptions, server).listen(config.port, () => {
            winston.info('API OAUTH Service started on ' + config.port)
        })
    })
