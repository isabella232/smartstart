'use strict';
// prefixEnv
//
// Because correlationIdentifiers use the PK of the audit table row,
// pxPay can refuse to create a transaction as there will be overlapping
// IDs. This function prefixes the correlationIdentifier with the env
// name or, in the case of development environments which have DB
// teardowns on rebuilds, a timestamp.
//
// Note that the max length of a TxnIn is 16 bytes.
//
// Import the function and pass it the string to be prefixed.
const appConfig = require('../../server/app-config.js');

const prefixEnv = function(rawId) {
  if (!appConfig.pxPayTxnIdPrefix) {
    return rawId;
  }

  if (process.env.NODE_ENV === 'development') {
    let timestamp = new Date().getTime();
    // have to keep it under 16 bytes - so timestamp alone
    return `${timestamp}`;
  }

  return `${appConfig.pxPayTxnIdPrefix}-${rawId}`;
};

module.exports = prefixEnv;
