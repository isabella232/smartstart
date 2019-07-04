'use strict';

const log = require('../../common/utils/logger.js');
const formatError = require('../../common/utils/format-error.js');

module.exports = () => {
  return (err, req, res, next) => {
    // this function catches errors that aren't already logged in a particular
    // method, such as 403 csrf token errors, and writes a log. logs that are
    // already specifically called are clever enough that we don't get dupes.
    if (err && err.statusCode !== 400) {
      // don't log 400s (validation errors)
      log.error(formatError(err, req.url));
    }
    next(err);
  };
};
