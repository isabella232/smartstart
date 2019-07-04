'use strict';
// timeoutValue
//
// PxPay take an 'Opt' parameter:
// A timeout (TO) can be set for the hosted payments page, after
// which the payment page will timeout and no longer allow a payment
// to be taken. The timeout timestamp is to be specified in Coordinated
// Universal Time (UTC). The value must be in the format "TO=yymmddHHmm"
// e.g. “TO=1010142221” for 2010 October 14th 10:21pm.
//
// Import the function and pass it the string to be prefixed.
const moment = require('moment');

const timeoutValue = function(now = new Date(), minutes = 20) {
  return `TO=${moment(now).utc().add(minutes, 'm').format('YYMMDDHHmm')}`;
};

module.exports = timeoutValue;
