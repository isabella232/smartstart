'use strict';

const app = require('../../../server/server');

module.exports = (state) => {
  return new Promise((resolve, reject) => {

    app.models.BirthRegistrationApplication.beginTransaction(
      {
        isolationLevel: app.models.BirthRegistrationApplication.Transaction.SERIALIZABLE,
        timeout: 15000 // 15000ms = 15s
      },
      (error, tx) => {
        // handle an error creating the transaction
        if (error) {
          let err500 = new Error('500 internal error - ' + error);
          err500.statusCode = 500;
          return reject(err500);
        }

        // handle a timeout event
        tx.observe('timeout', () => {
          // the code in this block always gets called after the timeout value,
          // but has no effect if the promise already resolved
          let err500 = new Error('txn timeout');
          err500.statusCode = 500;
          return reject(err500);
        });

        state.tx = tx;

        return resolve(state);
      }
    );
  });
};
