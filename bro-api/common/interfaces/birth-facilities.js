'use strict';

const fetch = require('../utils/fetch-retry.js');
const base64 = require('base-64');
const appConfig = require('../../server/app-config.js');
const checkStatus = require('../utils/check-status.js');

module.exports = () => {
  const fetchOpts = {};

  if (appConfig.eServerUser) {
    fetchOpts.headers = {
      Authorization: 'Basic ' + base64.encode(appConfig.eServerUser + ':' + appConfig.eServerPassword)
    };
  }

  return fetch(appConfig.eServerEndpoint + 'birth-facilities', fetchOpts)
    .then(checkStatus)
    .then(res => {
      return res.json();
    });
};
