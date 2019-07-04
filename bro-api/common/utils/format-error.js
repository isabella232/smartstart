'use strict';
module.exports = function formatError(error, url) {
  let errorLog = { err: error };

  if (error && error.statusCode) {
    errorLog.status = error.statusCode;
  };

  if (url) {
    errorLog.url = url;
  }

  return errorLog;
};
