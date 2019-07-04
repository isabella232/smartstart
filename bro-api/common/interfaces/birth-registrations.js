'use strict';

const fetch = require('../utils/fetch-retry.js');
const base64 = require('base-64');
const appConfig = require('../../server/app-config.js');
const checkStatus = require('../utils/check-status.js');

module.exports = (body) => {
  const fetchOpts = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (appConfig.eServerUser) {
    fetchOpts.headers['Authorization'] = 'Basic ' + base64.encode(appConfig.eServerUser + ':' + appConfig.eServerPassword);
  }

  return fetch(appConfig.eServerEndpoint + 'birth-registrations', fetchOpts)
    .then(checkStatus)
    .then(res => {
      return res.json();
    });
};
