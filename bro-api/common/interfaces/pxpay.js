'use strict';

const xml2js = require('xml2js');
const fetch = require('../utils/fetch-retry.js');
const appConfig = require('../../server/app-config.js');
const checkStatus = require('../utils/check-status.js');

const builder = new xml2js.Builder();
const parser = new xml2js.Parser();
const log = require('../utils/logger.js').child({ component: 'pxpay' });

module.exports = (request) => {
  return fetch(
    appConfig.pxPayEndpoint,
    {
      method: 'POST',
      body: builder.buildObject(request),
      headers: {
        'Content-Type': 'text/xml'
      }
    }
  )
    .then(checkStatus)
    .then(res => {
      return res.text();
    })
    .then(xml => {
      return new Promise((resolve, reject) => {
        parser.parseString(xml, (error, result) => {
          if (error) {
            log.error(error, 'Error parsing xml');
            let err500 = new Error('Unexpected error');
            err500.statusCode = 500;
            err500.stack = err500.stack + ' ' + error + ' ' + xml;
            reject(err500);
          }

          resolve(result);
        });
      });
    });
};
