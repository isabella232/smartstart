'use strict';
// checkStatus
//
// Used as a step in a fetch promise chain, to check response codes.
//
// 400 status codes are treated specially, as they indicate validation errors
// that need to be passed through to the originating request.
//
// Arguments:
// 'response' (required) - the fetch HTTP response
//
const log = require('./logger.js').child({ component: 'check-status' });
module.exports = function checkStatus(response) {
  if ((response.status >= 200 && response.status < 300) || response.status == 400) {
    return response;
  } else {
    let error = new Error(response.statusText);
    error.statusCode = response.status;
    error.message = response.statusText;
    log.error(error, 'Request failed');

    throw error;
  }
};
