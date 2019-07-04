'use strict';

const app = require('../../../server/server');

module.exports = (state) => {
  return new Promise((resolve, reject) => {
    app.models.BirthRegistrationApplication.findOne(
      { where: { 'applicationReferenceNumber': state.applicationReferenceNumber } },
      { transaction: state.tx },
      (error, record) => {
        if (error) {
          state.tx.rollback();
          let err500 = new Error('500 internal error - ' + error);
          err500.statusCode = 500;
          return reject(err500);
        } else if (!record) {
          // it either never existed (spurious valid applicationReferenceNumber?)
          // or, more likely, the user timed out the transaction and the
          // periodic cleanup task has already sent the application to eServer.
          // We can't redirect the user because we remain agnostic about
          // where the bro form request originated from.
          state.tx.rollback();
          let err410 = new Error('Already processed');
          err410.statusCode = 410;
          return reject(err410);
        }

        // collect details for local use
        state.record = record;
        state.body = record.body;
        state.auditExtras.submittedAt = state.record.submittedAt;

        app.models.BirthRegistrationApplication.upsert(
          state.record,
          { transaction: state.tx },
          error => {
            if (error) {
              // we might reach here if pxpay hit the url twice in quick sucession, but the transaction makes
              // the second upsert operation wait (at which point it normally continues, but could fail here).
              // we can assume that as it's been processed already we want to treat this as if it has
              // a processed flag - so bail gracefully here - we still want to redirect!
              state.tx.rollback();
              return reject({
                confirmUrlSuccess: state.record.confirmUrlSuccess,
                confirmUrlFail: state.record.confirmUrlFail
              });
            }
            return resolve(state);
          }
        );
      }
    );
  });
};
