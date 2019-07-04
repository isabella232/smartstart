'use strict';
// fetchRetry
//
// A wrapper around node-fetch to facilitate retries both
// for failed network requests, and when a status code >= 401
// is received. Note that checkStatus is called later in the
// chain and will fail any status >= 300 or < 200 (except 400),
// but those will not be retried.
//
// Arguments:
// 'url' (required) - the endpoint
// 'options' (optional) - a fetch options object which takes
//  two custom additional parameters:
//    'retries' (optional) - times the request will be retried (default 2)
//    'retryDelay' (optional) - milliseconds to wait before retry (default 500)
const fetch = require('node-fetch');

module.exports = function fetchRetry(url, options) {
  const retries = options ? options.retries || 2 : 2;
  const retryDelay = options ? options.retryDelay || 500 : 500;

  const fetchRetry = (resolve, reject) => {
    let retryCount = 0;

    const request = () => {
      fetch(url, options)
        .then(response => {
          if (response.status < 401) {
            resolve(response);
          } else {
            let error = new Error(response.statusText);
            error.statusCode = response.status;
            error.message = response.statusText + ' - ' + url;

            throw error;
          }
        })
        .catch(err => {
          if (retryCount < retries) {
            retryCount = retryCount + 1;
            setTimeout(request, retryDelay);
          } else {
            reject(err);
          }
        });
    };

    request();
  };

  return new Promise(fetchRetry);
};
