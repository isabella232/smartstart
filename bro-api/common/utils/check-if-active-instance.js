'use strict';

const appConfig = require('../../server/app-config.js');
const log = require('../utils/logger.js');
const formatError = require('../utils/format-error.js');

// As there could be multiple instances running the bro-api, e.g. with a load
// balancer, we must ensure that any non-request tasks (like the periodic
// cleanup task) are only run from one place. We can poll a db to find out if
// we are 'the' active instance.

module.exports = function(task, app) {
  process.nextTick(() => {
    app.models.ActiveHash.findOne(
      { where: {} }, // the empty where makes it return the first record - there should only be one
      (error, record) => {
        if (error) {
          log.error(formatError(error));
        } else {
          // only proceed running the task if there was no error
          if (record && record.hash == appConfig.activeHash) {
            // we're it, run the task
            task(app);
          }
        }
      }
    );
  });
};
