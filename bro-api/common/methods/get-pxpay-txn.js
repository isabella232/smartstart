'use strict';

const app = require('../../server/server');
const appConfig = require('../../server/app-config.js');
const birthRegistrationsAPI = require('../interfaces/birth-registrations.js');
const pxpayProcessResponseAPI = require('../interfaces/pxpay.js');
const hashId = require('../utils/hashid.js');
const pxPaylog = require('../utils/logger.js').child({ component: 'pxpay' });
const formatError = require('../utils/format-error.js');

module.exports = (applicationReferenceNumber, txnState, result, callback) => {

  const log = pxPaylog.child({ applicationReferenceNumber: applicationReferenceNumber });

  const initState = () => {
    return new Promise((resolve, reject) => {
      /**
       * Basic checks:
       *   - can we decode the passed in applicationReferenceNumber?
       *   - was a result provided?
       *   - was the state not success or fail?
       */

      let id = hashId.decode(applicationReferenceNumber);

      if (id.length === 0 || !result || !(txnState === 'success' || txnState === 'fail')) {
        let err404 = new Error('Invalid request');
        err404.statusCode = 404;
        return reject(err404);
      }

      /**
       * We pass a state object through our promise chain.
       * {record|object} the application to be submitted, plus metadata, from the db
       * {txnResult|object} the formatted result of the transaction response request
       * {auditExtras|object} a collection of extra detail for the audit not available from the application or txnResult
       */

      let state = {
        record: null,
        txnResult: null,
        auditExtras: {}
      };

      return resolve(state);
    });
  };

  const retrieveApplication = (state) => {
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
            let err500 = new Error('500 internal error - txn timeout');
            err500.statusCode = 500;
            return reject(err500);
          });

          app.models.BirthRegistrationApplication.findOne(
            { where: { 'applicationReferenceNumber': applicationReferenceNumber } },
            { transaction: tx },
            (error, record) => {

              if (error) {
                tx.rollback();
                let err500 = new Error('500 internal error - ' + error);
                err500.statusCode = 500;
                return reject(err500);
              } else if (!record) {
                // it either never existed (spurious valid applicationReferenceNumber?)
                // or, more likely, the user timed out the transaction and the
                // periodic cleanup task has already sent the application to eServer.
                // We can't redirect the user because we remain agnostic about
                // where the bro form request originated from.
                tx.rollback();
                let err410 = new Error('Already processed');
                err410.statusCode = 410;
                return reject(err410);
              } else if (record.processed) {
                // the FPRN from pxPay has already acted on this application
                // bail gracefully here - we still want to redirect!
                tx.rollback();
                return reject({
                  confirmUrlSuccess: record.confirmUrlSuccess,
                  confirmUrlFail: record.confirmUrlFail
                });
              }

              // collect details for local use
              state.record = record;
              state.auditExtras.submittedAt = state.record.submittedAt;

              // update the record to indicate that it's been acted upon
              state.record.processed = true;

              app.models.BirthRegistrationApplication.upsert(
                state.record,
                { transaction: tx },
                error => {
                  if (error) {
                    // we might reach here if pxpay hit the url twice in quick sucession, but the transaction makes
                    // the second upsert operation wait (at which point it normally continues, but could fail here).
                    // we can assume that as it's been processed already we want to treat this as if it has
                    // a processed flag - so bail gracefully here - we still want to redirect!
                    tx.rollback();
                    return reject({
                      confirmUrlSuccess: state.record.confirmUrlSuccess,
                      confirmUrlFail: state.record.confirmUrlFail
                    });
                  }

                  tx.commit();
                  return resolve(state);
                }
              );
            }
          );
        }
      );
    });
  };

  const getEcommerceResponse = (state) => {
    // build the result request
    let request = {
      ProcessResponse: {
        PxPayUserId: appConfig.pxPayUser,
        PxPayKey: appConfig.pxPayKey,
        Response: result
      }
    };

    // now the request is formed, return the fetch chain
    return pxpayProcessResponseAPI(request)
      .then(result => {

        const dateFormatter = (date) => {
          const dateString = date.toString();
          const year = dateString.substr(0, 4);
          const month = dateString.substr(4, 2);
          const day = dateString.substr(6, 2);

          return `${year}-${month}-${day}`;
        };

        let response = result.Response;

        state.txnResult = {
          transactionReference: response.DpsTxnRef.length > 0 ? response.DpsTxnRef[0] : '',
          cardNumber: response.CardNumber.length > 0 ? response.CardNumber[0] : '',
          cardHolderName: response.CardHolderName.length > 0 ? response.CardHolderName[0] : '',
          responseText: response.ResponseText.length > 0 ? response.ResponseText[0] : '',
          Valid: response['$'].valid ? response['$'].valid : '0',
          Success: response.Success.length > 0 ? parseInt(response.Success[0], 10) : 0,
          currencySettlement: response.CurrencySettlement.length > 0 ? response.CurrencySettlement[0] : '',
          amountSettlement: response.AmountSettlement.length > 0 ? parseFloat(response.AmountSettlement[0]) : 0,
          dateSettlement: (response.DateSettlement.length > 0 && response.DateSettlement[0].length === 8) ? dateFormatter(response.DateSettlement[0]) : '',
          authCode: response.AuthCode.length > 0 ? response.AuthCode[0] : ''
        };

        state.record.body.payment = {};
        state.record.body.payment.paymentProviderResponse = state.txnResult;
        return state;
      })
      .catch(error => {
        // update the audit log before we throw
        return createAuditRow(state)
          .then(state => resetProcessedState(state))
          .then(() => {
            // if the txn lookup failed we should still send the user to a confirm screen
            let pxPayFail = new Error('pxPay lookup fail');
            pxPayFail.confirmUrlSuccess = state.record.confirmUrlSuccess;
            pxPayFail.confirmUrlFail = state.record.confirmUrlFail;
            pxPayFail.statusCode = error.statusCode;
            throw pxPayFail;
          });
      });
  };

  const applicationPost = (state) => {
    // post application only if success
    // because we give user opportunity to retry
    // within around 5 min period

    if (txnState !== 'success') {
      // with promise.resolve we are going to next function block
      // createAuditRow
      return resetProcessedState(state)
        .then(state => Promise.resolve(state));
    } else {
      state.auditExtras.eServerSubmittedAt = new Date();

      return birthRegistrationsAPI(state.record.body)
      .then(result => {
        state.auditExtras.eServerResponseStatus = result.status;
        state.auditExtras.eServerDuplicate = !!result.duplicate;

        if (state.auditExtras.eServerDuplicate) {
          // Log a warning if eserver says the request is a duplicate
          log.warn('eServer reported duplicate');
        }

        if (result.status !== 'complete') {
          // we don't expect an invalid result here, as the application
          // has been through the validation succesfully already. The
          // user is no longer around to resolve issues, so we give up.
          log.warn(result, 'Submission not completed');
          let err500 = new Error('500 internal error - status from eServer was ' + result.status);
          err500.statusCode = 500;
          throw err500;
        }

        // Log completion of the application.
        log.info('Submission completed');

        return state;
      })
      .catch(error => {
        // update the audit log before we throw
        return createAuditRow(state)
        .then(state => resetProcessedState(state))
        .then(() => {
          // if the eserver submit failed we should still send the user to a confirm screen
          let eServerFail = new Error('eServer submission fail');
          eServerFail.confirmUrlSuccess = state.record.confirmUrlSuccess;
          eServerFail.confirmUrlFail = state.record.confirmUrlFail;
          eServerFail.statusCode = error.statusCode;
          throw eServerFail;
        });
      });
    }
  };

  const createAuditRow = (state) => {
    return new Promise((resolve, reject) => {
      let auditRecord = {
        'submittedAt': state.auditExtras.submittedAt,
        'applicationReferenceNumber': applicationReferenceNumber,
        'surname': state.record.body.child.surname,
        'requestSource': 'txnComplete',
        'eServerSubmittedAt': state.auditExtras.eServerSubmittedAt,
        'localDuplicate': false,
        'productCode': state.record.body.certificateOrder.productCode,
        'quantity': state.record.body.certificateOrder.quantity,
        'txnAttempted': true
      };

      if (state.record.body.certificateOrder.deliveryName) {
        auditRecord.deliveryName = state.record.body.certificateOrder.deliveryName;
      }
      if (state.record.body.certificateOrder.deliveryAddress) {
        auditRecord.deliveryAddress = state.record.body.certificateOrder.deliveryAddress;
      }
      if (state.txnResult && state.txnResult.responseText) {
        const txnSuccess = !!state.txnResult.Success;
        const txnMessage = state.txnResult.responseText;
        auditRecord.txnReconciled = true;
        auditRecord.txnSuccess = txnSuccess;
        auditRecord.txnMessage = txnMessage;
        if (!txnSuccess) {
          log.warn({ applicationReferenceNumber, txnMessage }, 'Transaction unsuccessful');
        }
      } else {
        auditRecord.txnReconciled = false;
      }
      if (state.auditExtras.eServerResponseStatus) {
        auditRecord.eServerResponseStatus = state.auditExtras.eServerResponseStatus;
      }
      if (typeof state.auditExtras.eServerDuplicate !== 'undefined') {
        auditRecord.eServerDuplicate = state.auditExtras.eServerDuplicate;
      }

      app.models.Audit.create(
        auditRecord,
        (error) => {
          if (error) {
            let err500 = new Error('500 internal error - ' + error);
            err500.statusCode = 500;
            return reject(err500);
          }

          return resolve(state);
        }
      );
    });
  };

  const resetProcessedState = (state) => {
    // in the event of a network fail we should reset the processed
    // flag on the record so the submission the the eServer will be
    // retried (either by the FPRN hitting this flow again, or via
    // the periodic cleanup).
    return new Promise((resolve, reject) => {
      state.record.processed = false;

      app.models.BirthRegistrationApplication.upsert(
        state.record,
        (error) => {
          if (error) {
            let err500 = new Error('500 internal error - ' + error);
            err500.statusCode = 500;
            return reject(err500);
          }

          return resolve(state);
        }
      );
    });
  };

  process.nextTick(() => {

    // Resolve all functions via promise chain
    initState()
    .then(state => retrieveApplication(state))
    .then(state => getEcommerceResponse(state))
    .then(state => applicationPost(state))
    .then(state => createAuditRow(state))
    .then(state => {
      // success! now we redirect using a 301 (see method setup in common/models/births.js)
      if (txnState === 'success') {
        return callback(null, state.record.confirmUrlSuccess, 'text/html; charset=utf-8');
      } else {
        return callback(null, state.record.confirmUrlFail, 'text/html; charset=utf-8');
      }
    })
    .catch(error => {
      if (error.confirmUrlSuccess && error.confirmUrlFail) {
        // if we have been passed a redirect object we should act on it rather than only returning an error
        if (error.statusCode) { log.error(formatError(error)); }
        if (txnState === 'success') {
          return callback(null, error.confirmUrlSuccess, 'text/html; charset=utf-8');
        } else {
          return callback(null, error.confirmUrlFail, 'text/html; charset=utf-8');
        }
      }
      log.error(formatError(error));
      return callback(error);
    });
  });
};
