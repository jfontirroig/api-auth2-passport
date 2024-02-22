/* @flow */
import logger from 'winston'
import axios from 'axios'
import qs from 'qs'

export class ApiServer {

    constructor(config) {
        this.config = config;
    }

    async initializeServer() {
    }

    shutdown() {
    }
}
