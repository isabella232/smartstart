'use strict';
// generateHashId
//
// Generate a hash that can be used as an identifier using
// https://www.npmjs.com/package/hashids
//
// Import the function and call one of its two methods, passing in an integer:
//   .encode()
//   .decode()
const hashids = require('hashids');
const appConfig = require('../../server/app-config.js');

const salt = appConfig.idHashSalt;
const hashidInstance = new hashids(
  salt,
  6, // pad to at least 6 chars
  'ABCDFGHJKLMNPQRSTVWXYZ0123456789' // custom alphabet to avoid case sensitivity
);
module.exports = hashidInstance;
