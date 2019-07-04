'use strict';

const cron = require('node-cron');
const checkIfActiveInstance = require('../../common/utils/check-if-active-instance.js');
const scheduledTask = require('../../common/methods/periodic-registrations-cleanup.js');

module.exports = function(app, cb) {
  /*
   * The `app` object provides access to a variety of LoopBack resources such as
   * models (e.g. `app.models.YourModelName`) or data sources (e.g.
   * `app.datasources.YourDataSource`). See
   * http://docs.strongloop.com/display/public/LB/Working+with+LoopBack+objects
   * for more info.
   */
  process.nextTick(() => {
    cron.schedule('*/30 * * * *', ()  => {
      // similar to the make_live task for the b/e, check if we're the active
      // instance that should be running this task before running it
      checkIfActiveInstance(scheduledTask, app);
      // if we didn't need to do the active check, we could just run scheduledTask(app)
    });
    cb();
  });
};
