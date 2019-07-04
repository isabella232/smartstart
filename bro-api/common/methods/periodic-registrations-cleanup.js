'use strict';

const birthRegistrationsAPI = require('../interfaces/birth-registrations.js');
const log = require('../utils/logger.js').child({ component: 'periodic-registrations' });
;
const formatError = require('../utils/format-error.js');
const PromiseThrottle = require('promise-throttle');

const THIRTY_MINS = 30 * 60 * 1000;  // 30 mins in milliseconds

module.exports = (app) => {

  // Async functions

  const applicationPost = (row) => {
    row.auditExtras = {};
    row.auditExtras.eServerSubmittedAt = new Date();

    return birthRegistrationsAPI(row.body)
      .then(result => {
        row.auditExtras.eServerResponseStatus = result.status;
        row.auditExtras.eServerDuplicate = !!result.duplicate;

        if (result.status !== 'complete') {
          // this will prevent infinite submission of invalid records
          markRecordInvalid(row);

          let err500 = new Error('500 internal error - status was ' + result.status);
          err500.statusCode = 500;
          throw err500;
        }

        // Log completion of the application.
        log.info({ applicationReferenceNumber: row.body.applicationReferenceNumber }, 'Submission completed');

        return row;
      })
      .catch(error => {
        // update the audit log before we throw
        return createAuditRow(row)
          .then(() => {
            throw error;
          });
      });
  };

  const createAuditRow = (row) => {
    return new Promise((resolve, reject) => {
      const applicationReferenceNumber = row.applicationReferenceNumber;
      let auditRecord = {
        'submittedAt': row.submittedAt,
        'applicationReferenceNumber': applicationReferenceNumber,
        'surname': row.body.child.surname,
        'requestSource': 'txnTimeout',
        'eServerSubmittedAt': row.auditExtras.eServerSubmittedAt,
        'localDuplicate': false,
        'productCode': row.body.certificateOrder.productCode,
        'quantity': row.body.certificateOrder.quantity,
        'txnAttempted': true,
        'txnReconciled': false,
        'txnSuccess': false
      };

      if (row.body.certificateOrder.deliveryName) {
        auditRecord.deliveryName = row.body.certificateOrder.deliveryName;
      }
      if (row.body.certificateOrder.deliveryAddress) {
        auditRecord.deliveryAddress = row.body.certificateOrder.deliveryAddress;
      }
      if (typeof row.body.payment !== 'undefined') {
        auditRecord.txnReconciled = true;

        if (row.body.payment.paymentProviderResponse && row.body.payment.paymentProviderResponse.Success) {
          auditRecord.txnSuccess = true;
        }
        if (row.body.payment.paymentProviderResponse && row.body.payment.paymentProviderResponse.responseText) {
          auditRecord.txnMessage = row.body.payment.paymentProviderResponse.responseText;
        }
      } else {
        // there was a cert order but we didn't manage to reconcile it... log error
        let txnReconciledFail = new Error('Cert order not reconciled for ' + row.body.applicationReferenceNumber);
        log.error(formatError(txnReconciledFail));
      }
      var eServerResponseStatus = '';
      if (row.auditExtras.eServerResponseStatus) {
        eServerResponseStatus = row.auditExtras.eServerResponseStatus;
        auditRecord.eServerResponseStatus = eServerResponseStatus;
      }
      if (typeof row.auditExtras.eServerDuplicate !== 'undefined') {
        auditRecord.eServerDuplicate = row.auditExtras.eServerDuplicate;
      }

      log.warn({ applicationReferenceNumber, eServerResponseStatus  }, 'Transaction timeout');

      app.models.Audit.create(
        auditRecord,
        (error) => {
          if (error) {
            let err500 = new Error('500 internal error - ' + error);
            err500.statusCode = 500;
            return reject(err500);
          }

          return resolve(row);
        }
      );
    });
  };

  const markRecordInvalid = (row) => {
    return new Promise(resolve => {
      row.eServerRejected = true;
      app.models.BirthRegistrationApplication.upsert(
        row,
        error => {
        // handle an error creating the transaction
          if (error) {
            let err500 = new Error('500 internal error - ' + error);
            err500.statusCode = 500;
            throw err500;
          } else {
            resolve(row);
          }
        });
    });
  };

  const destroyById = (row, tx) => {
    return new Promise(resolve => {
      if (tx) {
        app.models.BirthRegistrationApplication.destroyById(
          row.id,
          { transaction: tx },
          error => {
            if (error) {
              let err500 = new Error('500 internal error - ' + error);
              err500.statusCode = 500;
              throw err500;
            }

            resolve(row, tx);
          });
      }
    });
  };

  process.nextTick(() => {

    // find all applications that were created more than 30 minutes ago
    app.models.BirthRegistrationApplication.find(
      { where: {
        'submittedAt': { lt: Date.now() - THIRTY_MINS },
        'eServerRejected': false
      } },
      (error, rows) => {
        if (error) {
          let err500 = new Error('500 internal error - ' + error);
          err500.statusCode = 500;
          // we don't want to affect the rest of the application,
          // so just just log the error. if there was an error there are no rows
          // so the rest of the code doesn't execute.
          log.error(formatError(err500));
        }

        let start = Date.now();
        log.info('Running cleanup task for %s applications', rows.length);

        let promiseThrottle = new PromiseThrottle({
          requestsPerSecond: 50,
          promiseImplementation: Promise
        });
        // keep promises for row processing so we can tell when everything is complete
        let promises = [];

        rows.forEach(row => {
          try {
            // if the row is marked as processed, then it has already
            // been submitted to the eServer, and there is nothing further
            // to do.
            if (row.processed) {
              // delete it!
              promises.push(new Promise(resolve => {
                app.models.BirthRegistrationApplication.destroyById(
                  row.id,
                  error => {
                    if (error) {
                      let err500 = new Error('500 internal error - ' + error);
                      err500.statusCode = 500;
                      throw err500;
                    }
                    resolve();
                  });
              }));
            } else {
              // if it's not processed yet, then it's orphaned (the txn
              // was abandoned or timed out) and we need to submit it.
              let promise = promiseThrottle.add(applicationPost.bind(this, row))
                .then(row => {
                  return new Promise((resolve, reject) => {
                    // start transaction
                    app.models.BirthRegistrationApplication.beginTransaction(
                      {
                        isolationLevel: app.models.BirthRegistrationApplication.Transaction.READ_COMMITTED,
                        timeout: 15000 // 15000ms = 15s
                      },
                      (error, tx) => {

                        // handle an error creating the transaction
                        if (error) {
                          let err500 = new Error('500 internal error - ' + error);
                          err500.statusCode = 500;
                          throw err500;
                        }
                        destroyById(row, tx)
                        .then(() => createAuditRow(row))
                        .then(() => tx.commit())
                        .then(() => resolve())
                        .catch(error => reject());
                      });
                  });
                })
                .catch(error => {
                  // we don't want to affect the rest of the application,
                  // so just just log the error and prevent the deletion
                  log.error(formatError(error));
                });
              promises.push(promise);
            }
          } catch (error) {
            // we don't want to affect the rest of the application,
            // so just just log the error
            log.error(formatError(error));
          }
        });
        Promise.all(promises)
          .then(() => {
            var cleanupDuration = ((Date.now() - start) / 1000).toFixed(2);
            log.info({ cleanupDuration }, 'Cleanup task completed');
          });
      }
    );
  });
};
