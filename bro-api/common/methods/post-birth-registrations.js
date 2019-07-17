'use strict';

const app = require('../../server/server');
const birthRegistrationsAPI = require('../interfaces/birth-registrations.js');
const titleCase = require('../utils/title-case.js');
const hashId = require('../utils/hashid.js');
const log = require('../utils/logger.js').child({ component: 'birthregistration' });
const formatError = require('../utils/format-error.js');
const config = require('../../server/app-config');

const generatePaymentURL = require('./shared/generate-payment-url.js');

module.exports = (body, req, options, callback) => {

  // Functions (called from promise chain)

  const initState = () => {
    return new Promise((resolve, reject) => {
      /**
       * We pass a state object through our promise chain.
       * {resolved|boolean} when true, further optional chain actions can be skipped
       * {submittedAt|date} datetime of POST, to be recorded in the audit log
       * {body|object} the POST body
       * {originalActivity|string} a copy of the activity from when the POST was originally received
       * {responseStatus|integer} 200 or 400 response (500's are handled by catch)
       * {responseBody|object} the object that will be returned in the response
       * {auditExtras|object} a collection of extra detail for the audit not available from the body
       */
      let state = {
        resolved: false,
        submittedAt: new Date(),
        body: body,
        originalActivity: body.activity ? body.activity.slice(0) : 'fullSubmission',
        responseStatus: 200,
        responseBody: {},
        auditExtras: {},
        confirmUrlSuccess: body.confirmationUrlSuccess,
        confirmUrlFail: body.confirmationUrlFailure,
        confirmationEmailAddress: body.confirmationEmailAddress
      };

      // naive check that the submission is well-formed
      if (typeof state.body !== 'object' || Object.keys(state.body).length === 0) {
        let err400 = new Error('Invalid submission');
        err400.statusCode = 400;
        return reject(err400);
      }

      if (!state.body.activity) {
        // fullSubmission is the default value in the spec
        state.body.activity = 'fullSubmission';
      }

      // unset some properties from the body that won't be needed by the eServer
      delete state.body.confirmationUrlSuccess;
      delete state.body.confirmationUrlFailure;

      // transform up to four fields (if they are set) into title case
      if (
        state.body.birthPlace &&
        state.body.birthPlace.other
      ) {
        state.body.birthPlace.other = titleCase(state.body.birthPlace.other);
      }
      if (
        state.body.child &&
        state.body.child.ethnicGroups &&
        state.body.child.ethnicGroups.other
      ) {
        state.body.child.ethnicGroups.other = titleCase(state.body.child.ethnicGroups.other);
      }
      if (
        state.body.mother &&
        state.body.mother.ethnicGroups &&
        state.body.mother.ethnicGroups.other
      ) {
        state.body.mother.ethnicGroups.other = titleCase(state.body.mother.ethnicGroups.other);
      }
      if (
        state.body.father &&
        state.body.father.ethnicGroups &&
        state.body.father.ethnicGroups.other
      ) {
        state.body.father.ethnicGroups.other = titleCase(state.body.father.ethnicGroups.other);
      }

      return resolve(state);
    });
  };

  const initAuditRow = (state) => {
    // we want the audit record created for any records that are fullSubmission
    if (state.originalActivity !== 'fullSubmission') {
      return state;
    }

    return new Promise((resolve, reject) => {
      let auditRecord = {
        'submittedAt': state.submittedAt,
        'surname': state.body.child && state.body.child.surname ? state.body.child.surname.trim() : 'not provided',
        'requestSource': options.referer ? options.referer : 'unknown'
      };

      if (state.body.certificateOrder) {
        if (state.body.certificateOrder.productCode) auditRecord.productCode = state.body.certificateOrder.productCode;
        if (state.body.certificateOrder.quantity) auditRecord.quantity = state.body.certificateOrder.quantity;
        if (state.body.certificateOrder.deliveryName) auditRecord.deliveryName = state.body.certificateOrder.deliveryName;
        if (state.body.certificateOrder.deliveryAddress) auditRecord.deliveryAddress = state.body.certificateOrder.deliveryAddress;
      }

      app.models.Audit.create(
        auditRecord,
        (error, record) => {
          if (error) {
            let err500 = new Error('500 internal error');
            err500.statusCode = 500;
            return reject(err500);
          }

          // create the potential applicationReferenceNumber based on the PK of the audit record
          state.body.applicationReferenceNumber = hashId.encode(record.id);

          return resolve(state);
        }
      );
    });
  };

  const duplicateCheck = (state) => {

    return new Promise((resolve, reject) => {
      // check if submissions awaiting purchase reconciliation have identical
      // child.firstNames, child.surname, and child.birthDate to current application
      if (
        state.body.child &&
        state.body.child.firstNames &&
        state.body.child.surname &&
        state.body.child.birthDate
      ) {
        app.models.BirthRegistrationApplication.findOne(
          {
            where: {
              'childFirstNames': state.body.child.firstNames.trim(),
              'childSurname': state.body.child.surname.trim(),
              'childBirthDate': state.body.child.birthDate
            }
          },
          (error, application) => {
            if (error) {
              let err500 = new Error('500 internal error - ' + error);
              err500.statusCode = 500;
              return reject(err500);
            }

            if (application) {
              state.responseStatus = 400;
              state.responseBody.duplicate = true;
              // note that in the case of a local dupe we don't get other validation errors
              state.resolved = true;
            }

            return resolve(state);
          }
        );
      } else {
        // if we didn't have the right fields to check just keep going, the
        // eServer will catch it
        return resolve(state);
      }
    });
  };

  const preventPrematureSubmission = (state) => {
    if (state.resolved) {
      return state;
    }

    return new Promise((resolve, reject) => {
      if (
        state.body.activity === 'fullSubmission' &&
        state.body.certificateOrder &&
        state.body.certificateOrder.productCode &&
        state.body.certificateOrder.quantity
      ) {
        // if we have to store the application while we do e-commerce,
        // we need to fiddle with the activity (the original value is preserved in state.originalActivity)
        // so we don't accidentally submit when we do an initial validation check
        state.body.activity = 'validateOnly';

        // we also need to be able to redirect the user on success or fail of txn
        // so we check here that we have the necessary data to perform that
        if (!state.confirmUrlSuccess || !state.confirmUrlFail) {
          let err400 = new Error('Invalid submission');
          err400.statusCode = 400;
          return reject(err400);
        }
      }

      return resolve(state);
    });
  };

  const transformBody = (state) => {
    // this function is used to modify a body before it is sent to eServer
    //  currently we need to strip of confirmation email address only
    return new Promise((resolve) => {
      delete state.body.confirmationEmailAddress;
      resolve(state);
    });
  };

  const applicationPost = (state) => {
    if (state.resolved) {
      return state;
    }

    state.auditExtras.eServerSubmittedAt = new Date();

    if (state.originalActivity === 'fullSubmission') {
      // Logs the whole application to AWS cloudwatch
      log.info({ applicationReferenceNumber: state.body.applicationReferenceNumber }, 'Submission started');
      log.debug(state.body, 'birth registration payload');
    }

    return birthRegistrationsAPI(state.body)
      .then(result => {
        state.auditExtras.eServerResponseStatus = result.status;
        state.auditExtras.eServerDuplicate = !!result.duplicate;
        var applicationReferenceNumber = state.body.applicationReferenceNumber;

        if (result.duplicate || result.status === 'invalid') {
          // submission has fatal errors or is a duplicate
          log.warn({ applicationReferenceNumber, result }, 'Submission invalid or a duplicate');
          state.responseStatus = 400;
          state.responseBody = Object.assign(state.responseBody, result);
          state.resolved = true;

          return state;
        } else if (state.originalActivity === 'validateOnly' || state.body.activity === 'fullSubmission') {
          // valid response, and we were either performing validation only
          // OR we actually submitted (birth certificate wasn't requested)
          state.responseStatus = 200;
          state.responseBody.status = result.status; // 'valid' for validateOnly, 'complete' for fullSubmission
          state.resolved = true;

          // if this was a fullSubmission that suceeeded, add the applicationReferenceNumber to the response
          if (state.body.activity === 'fullSubmission') {
            state.responseBody.applicationReferenceNumber = state.body.applicationReferenceNumber;
          }

          // add any non-fatal warnings
          if (result.errors && result.errors.length > 0) {
            state.responseBody.errors = result.errors;
            var originalActivity = state.originalActivity;
            var activity = state.body.activity;
            log.warn({ applicationReferenceNumber, result, activity, originalActivity }, 'Submission contained errors');
          }

          return state;
        } else {
          // certificate required - add elements to reponse prior to next steps
          state.responseBody.applicationReferenceNumber = state.body.applicationReferenceNumber;

          // add any non-fatal warnings
          if (result.errors && result.errors.length > 0) {
            state.responseBody.errors = result.errors;
            log.warn({ applicationReferenceNumber, result }, 'Submission contained errors; certificate required');
          }

          return state;
        }
      })
      .catch(error => {
        if (state.originalActivity === 'fullSubmission') {
          // update the audit log before we throw
          return updateAuditRow(state)
            .then(() => {
              throw error;
            });
        } else {
          throw error;
        }
      });
  };

  const getEcommerceTxn = (state) => {
    return generatePaymentURL(state)
      .catch(error => {
        if (state.originalActivity === 'fullSubmission') {
          // update the audit log before we throw
          return updateAuditRow(state)
            .then(() => {
              throw error;
            });
        } else {
          throw error;
        }
      });
  };

  const storeApplication = (state) => {
    return new Promise((resolve, reject) => {
      if (state.resolved) {
        return resolve(state);
      }

      // change the activity back to its original value (should be 'fullSubmission')
      state.body.activity = state.originalActivity;

      let application = {
        'submittedAt': state.submittedAt,
        'body': state.body,
        'childFirstNames': state.body.child && state.body.child.firstNames ? state.body.child.firstNames.trim() : '',
        'childSurname': state.body.child && state.body.child.surname ? state.body.child.surname.trim() : '',
        'childBirthDate': state.body.child && state.body.child.birthDate ? state.body.child.birthDate : '',
        'applicationReferenceNumber': state.body.applicationReferenceNumber,
        'confirmUrlSuccess': state.confirmUrlSuccess,
        'confirmUrlFail': state.confirmUrlFail
      };

      app.models.BirthRegistrationApplication.create(
        application,
        (error) => {
          if (error) {
            let err500 = new Error('500 internal error - ' + error);
            err500.statusCode = 500;
            return reject(err500);
          }

          state.responseStatus = 200;
          state.responseBody.status = 'complete';
          state.resolved = true;

          // NOTE THAT: we don't actually submit the application here. This
          // happens asynchronously either as a result of an e-commerce
          // result, or a periodic task.

          return resolve(state);
        }
      );
    });
  };

  const updateAuditRow = (state) => {
    // we want the audit record updated for any records that are
    // fullSubmission (with applicationReferenceNumber and reponse details)
    if (state.originalActivity !== 'fullSubmission') {
      return state;
    }

    return new Promise((resolve, reject) => {
      // decode the applicationReferenceNumber to get the PK of the audit record back
      const auditTablePK = parseInt(hashId.decode(state.body.applicationReferenceNumber), 10);

      let auditRecordUpdate = {
        'id': auditTablePK,
        'applicationReferenceNumber': state.body.applicationReferenceNumber,
        'eServerSubmittedAt': state.auditExtras.eServerSubmittedAt
      };

      auditRecordUpdate.localDuplicate = !!state.responseBody.duplicate;

      if (typeof state.auditExtras.txnAttempted !== 'undefined') {
        auditRecordUpdate.txnAttempted = state.auditExtras.txnAttempted;
        auditRecordUpdate.txnReconciled = false;
      }

      if (state.auditExtras.txnMessage) {
        auditRecordUpdate.txnMessage = state.auditExtras.txnMessage;
      }

      if (state.auditExtras.eServerResponseStatus) {
        auditRecordUpdate.eServerResponseStatus = state.auditExtras.eServerResponseStatus;
      }

      if (typeof state.auditExtras.eServerDuplicate !== 'undefined') {
        auditRecordUpdate.eServerDuplicate = state.auditExtras.eServerDuplicate;
      }

      log.info({ 'requestUserIp': req.headers['x-real-ip'], 'auditRecordUpdate': auditRecordUpdate }, 'Updating audit record');

      app.models.Audit.upsert(auditRecordUpdate, error => {
        if (error) {
          let err500 = new Error('500 internal error - ' + error);
          err500.statusCode = 500;
          return reject(err500);
        }

        return resolve(state);
      });
    });
  };

  const sendEmailConfimation = (state) => {
    // email should be only send on full submission
    if (state.originalActivity !== 'fullSubmission') {
      return state;
    }
    return new Promise((resolve, reject) => {
      if (state.responseStatus !== 200) {
        resolve(state);
      } else {
        // if eServer successfully processed registration
        // we send confirmation email
        const emailTo = state.confirmationEmailAddress;

        // only send an email if user has provided response url
        if (emailTo) {
          app.models.Email.send({
            to: emailTo,
            from: config.confirmationEmailSettings.from,
            replyTo: config.confirmationEmailSettings.replyTo,
            subject: 'Birth registration submitted',
            envelope: {
              from: config.confirmationEmailSettings.bounceTo,
              to: emailTo
            },
            text:
              `Thank you for completing a birth registration in SmartStart – your reference number is ${state.body.applicationReferenceNumber}.
If we have any questions about your registration submission we will contact you.

Birth registrations are typically processed within 8 working days.
If you have requested an IRD number for your child this may take up to 15 days after the birth registration has been completed to be sent to you.

If you want to contact us about your baby's registration you can email bdm.nz@dia.govt.nz or call free on 0800 225 255 (NZ only).

Kind regards,
The SmartStart team`
          }, (err, mail) => {
            if (!err) {
              state.responseBody.confirmationEmailAddress = state.confirmationEmailAddress;
              log.info({ emailTo }, 'Email sent successfully');
              resolve(state);
            } else {
              // if failed to send email,
              // log error and proceed through promise chain
              log.error(err);
              return resolve(state);
            }
          });
        } else {
          // no email defined, just resolve
          return resolve(state);
        }
      }
    });
  };

  // End of function setup

  process.nextTick(() => {

    // Resolve all functions via promise chain
    initState()
      .then(state => initAuditRow(state))
      .then(state => duplicateCheck(state))
      .then(state => preventPrematureSubmission(state))
      .then(state => transformBody(state))
      .then(state => applicationPost(state))
      .then(state => getEcommerceTxn(state))
      .then(state => storeApplication(state))
      .then(state => updateAuditRow(state))
      .then(state => sendEmailConfimation(state))
      .then(state => {
        if (state.responseStatus === 400) {
          let err400 = new Error('Invalid submission');
          err400.statusCode = 400;

          // merge errors object with the Error
          return callback(Object.assign(err400, state.responseBody));
        }

        return callback(null, state.responseBody);
      })
      .catch(error => {
        log.error(formatError(error));
        return callback(error);
      });

  });
};
