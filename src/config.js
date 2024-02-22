import winston from 'winston'
import fs from 'fs'

const configDefaults = {
    winstonConsoleTransport: {
        level: 'info',
        handleExceptions: false,
        timestamp: true,
        stringify: true,
        colorize: true,
        json: false
    },
    domainName: 'api-oauth2-passport-github.id',
    port: 3022,
    minBatchSize: 1,
    GITHUB_CLIENT_ID:'Iv1.e6f6b4bed1f633b8',
    GITHUB_CLIENT_SECRET:'94c96ad4435c878387b205069aaf21741c5e7a8d',

    GOOGLE_CLIENT_ID:'305127334520-a4fs9nm02n88vp7tiko2qe4efdnd8bmt.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET:'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',

    FACEBOOK_CLIENT_ID:'1068621587807911',
    FACEBOOK_CLIENT_SECRET:'eb5429c984e87bdd08ff92ad21f2ea0b',

    DISCORD_CLIENT_ID:'1199088015612588122',
    DISCORD_CLIENT_SECRET:'U9wJFfW4FHSbeGLBlgdcWDDUWNdmp3oh',

    TWITTER_CONSUMER_KEY:'dVBnWkhPZGVKalltejQxbHBaSkg6MTpjaQ',
    TWITTER_CONSUMER_SECRET:'bqxJ0azaZk9WV5dkk8WIqgVDOX0w79IP26ZYejXE4GFSwJvKe_',

    SESSION_SECRET:'abc123'
  }


export function getConfig() {
    let config = Object.assign({}, configDefaults)
    if (process.env.API_OAUTH2_DEVELOP) {
        config = Object.assign({}, configDevelopDefaults)
        config.development = true
    }

    if (process.env.API_OAUTH2_CONFIG) {
        const configFile = process.env.API_OAUTH2_CONFIG
        Object.assign(config, JSON.parse(fs.readFileSync(configFile)))
    }

    config.winstonConfig = {
        transports: [
            new winston.transports.Console(config.winstonConsoleTransport),
            new winston.transports.File({
                maxsize: 5120000,
                maxFiles: 10,
                filename: `${__dirname}/../logs/api_oauth2.log`,
                level: 'debug',
                handleExceptions: false,
                timestamp: true,
                stringify: true,
                colorize: false,
                json: false
            })
        ]
    }

    return config
}
