'use strict';

const htmlencode = require('he');
const hashId = require('../utils/hashid.js');

const app = require('../../server/server');
const appConfig = require('../../server/app-config.js');
const formatError = require('../utils/format-error.js');
const timeoutValue = require('../utils/timeout-value.js');
const log = require('../utils/logger.js');
const prefixEnv = require('../utils/prefix-env.js');
const pxpayGenerateRequestAPI = require('../interfaces/pxpay.js');

const startTransaction = require('./shared/start-transaction.js');
const retrieveApplication = require('./shared/retrieve-application.js');
const commitTransaction = require('./shared/commit-transaction.js');
const generatePaymentURL = require('./shared/generate-payment-url.js');

module.exports = (applicationReferenceNumber, callback) => {

  // Functions (called from promise chain)
  const initState = () => {
    return new Promise((resolve, reject) => {

      const id = hashId.decode(applicationReferenceNumber);
      if (!id.length) {
        let err404 = new Error('Invalid request');
        err404.statusCode = 404;
        return reject(err404);
      }

      let state = {
        applicationReferenceNumber,
        responseBody: {},
        auditExtras: {}
      };
      return resolve(state);
    });
  };

  const getEcommerceTxn = (state) => {
    return generatePaymentURL(state)
      .catch(error => {
          // create the audit log before we throw
        return createAuditRow(state)
          .then(() => {
            throw error;
          });
      });
  };

  // update submittedAt and processed props
  const updateRecord = (state) => {

    return new Promise((resolve, reject) => {
      // add 30 min from now
      state.record.submittedAt = new Date(new Date().getTime() + 30 * 60 * 1000);

      // when user tries for the first time, app marks record as processed
      // to prevent application submitting record twice, because of the FPRN from pxPay (multiple responses)
      // on retry we should unset processed flag, because we're expecting new response
      // to come from pxPay
      state.record.processed = false;

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
    });
  };

  const createAuditRow = (state) => {
    return new Promise((resolve, reject) => {
      state.auditRecord = Object.assign(state.auditExtras, {
        'applicationReferenceNumber': applicationReferenceNumber,
        'requestSource': 'txnRetry',
        'submittedAt': state.record.submittedAt,
        'surname': state.record.childSurname
      });
      // update audit record
      const { certificateOrder } = state.record.body || {};

      if (typeof state.auditExtras.txnAttempted !== 'undefined') {
        state.auditRecord.txnAttempted = state.auditExtras.txnAttempted;
        state.auditRecord.txnReconciled = false;
      }

      if (state.auditExtras.txnMessage) {
        state.auditRecord.txnMessage = state.auditExtras.txnMessage;
      }
      if (certificateOrder) {
        if (certificateOrder.productCode) state.auditRecord.productCode = certificateOrder.productCode;
        if (certificateOrder.quantity) state.auditRecord.quantity = certificateOrder.quantity;
        if (certificateOrder.deliveryName) state.auditRecord.deliveryName = certificateOrder.deliveryName;
        if (certificateOrder.deliveryAddress) state.auditRecord.deliveryAddress = certificateOrder.deliveryAddress;
      }

      if (state.auditRecord.txnMessage) {
        state.auditRecord.txnMessage = state.auditExtras.txnMessage;
      }

      app.models.Audit.create(
        state.auditRecord,
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

  // End of function setup
  process.nextTick(() => {
    initState()
      .then(state => startTransaction(state))
      .then(state => retrieveApplication(state))
      .then(state => updateRecord(state))
      .then(state => commitTransaction(state))
      .then(state => getEcommerceTxn(state))
      .then(state => createAuditRow(state))
      .then(state => {
        if (state.responseBody.paymentURL) {
          callback(null, state.responseBody);
        } else {
          let err500 = new Error('no payment url');
          err500.statusCode = 500;
          return Promise.reject(err500);
        }
      })
      .catch(error => {
        log.error(formatError(error));
        return callback(error);
      });
  });
};
