'use strict';

module.exports = function(Births) {
  /**
   * Register a birth
   * @param {BirthRegistrationApplication} body birth registration object
   * @callback {Function} callback Callback function
   * @param {Error|string} err Error object
   * @param {any} result Result object
   */
  Births.postBirthRegistrations = require('../methods/post-birth-registrations.js');

  Births.beforeRemote('postBirthRegistrations', (ctx, unused, next) => {
    ctx.args.options.referer = ctx.req.get('Referer');
    next();
  });

  /**
   * Confirm and finalise payment
   * @param {string} correlationId birth registration application id
   * @param {string} result undefined
   * @callback {Function} callback Callback function
   * @param {Error|string} err Error object
   * @param {any} result Result object
   */
  Births.getBirthRegistrationsCorrelationIdPayments = require('../methods/get-pxpay-txn.js');

  /**
   * Generate a new payment transaction and return the redirect path
   * @param {string} correlationId birth registration application id
   * @callback {Function} callback Callback function
   * @param {Error|string} err Error object
   * @param {any} result Result object
   */
  Births.retryPayment = require('../methods/retry-failed-payment.js');

  Births.remoteMethod('postBirthRegistrations', {
    isStatic: true,
    accepts: [
      {
        arg: 'body',
        type: 'object',
        description: 'birth registration object',
        required: true,
        http: { source: 'body' }
      },
      {
        arg: 'req',
        type: 'object',
        description: 'request object',
        required: true,
        http: { source: 'req' }
      },
      {
        arg: 'options',
        type: 'object',
        http: 'optionsFromRequest'
      }
    ],
    returns: { arg: 'response', type: 'object' },
    http: { verb: 'post', path: '/birth-registrations' },
    description: 'Register a birth'
  });

  Births.remoteMethod('getBirthRegistrationsCorrelationIdPayments', {
    isStatic: true,
    accepts: [
      {
        arg: 'applicationReferenceNumber',
        type: 'string',
        description: 'birth registration application id',
        required: true,
        http: { source: 'path' }
      },
      {
        arg: 'state',
        type: 'string',
        description: 'success or fail of txn',
        required: true,
        http: { source: 'path' }
      },
      { arg: 'result',
        type: 'string',
        description: 'FPRN query string',
        required: false,
        http: { source: 'query' }
      }
    ],
    returns: [
      { arg: 'Location', type: 'string', http: { target: 'header' } },
      { arg: 'Content-Type', type: 'string', http: { target: 'header' } }
    ],
    http: {
      verb: 'get',
      path: '/birth-registrations/:applicationReferenceNumber/payments/:state',
      status: 301
    },
    description: 'Confirm and finalise payment'
  });

  Births.remoteMethod('retryPayment', {
    isStatic: true,
    accepts: [
      {
        arg: 'applicationReferenceNumber',
        type: 'string',
        description: 'birth registration application id',
        required: true,
        http: { source: 'path' }
      }
    ],
    returns: { arg: 'response', type: 'object' },
    http: {
      verb: 'get',
      path: '/birth-registrations/:applicationReferenceNumber/retry-payment'
    },
    description: 'Generate a new payment transaction and return the redirect path'
  });
};
