'use strict';
const bunyan = require('bunyan');
const RotatingFileStream = require('bunyan-rotating-file-stream');
const appConfig = require('../../server/app-config.js');

module.exports = bunyan.createLogger({
  name: 'bro-api',
  stream: process.stdout,
  level: 'debug'
});
