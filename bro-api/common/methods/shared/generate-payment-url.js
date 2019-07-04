'use strict';

const htmlencode = require('he');
const appConfig = require('../../../server/app-config.js');
const prefixEnv = require('../../utils/prefix-env.js');
const timeoutValue = require('../../utils/timeout-value.js');
const pxpayGenerateRequestAPI = require('../../interfaces/pxpay.js');

module.exports = (state) => {
  if (state.resolved) {
    state.auditExtras.txnAttempted = false;
    return Promise.resolve(state);
  }

  // build the payment request
  let request = {
    GenerateRequest: {
      PxPayUserId: appConfig.pxPayUser,
      PxPayKey: appConfig.pxPayKey,
      TxnType: 'Purchase',
      CurrencyInput: 'NZD',
      UrlSuccess: `${appConfig.domain}/birth-registration-api/Births/birth-registrations/`.concat(
        `${state.body.applicationReferenceNumber}/payments/success`
      ),
      UrlFail: `${appConfig.domain}/birth-registration-api/Births/birth-registrations/`.concat(
        `${state.body.applicationReferenceNumber}/payments/fail`
      ),
      Opt: timeoutValue()
    }
  };

  // calculate the payment amount
  const { applicationReferenceNumber, certificateOrder } = state.body || {};
  const { productCode, quantity, courierDelivery, deliveryName, deliveryAddress, emailAddress } = certificateOrder || {};
  if (appConfig.products[productCode] && quantity) {
    let amount = appConfig.products[productCode] * quantity;

    if (courierDelivery) {
      amount = amount + appConfig.courierDelivery;
    }

    request.GenerateRequest.AmountInput = amount;
  } else {
    // payment amount is required - fail if not present. this should have failed
    // the eServer's validation, but no harm in double checking!
    state.responseStatus = 400;
    state.resolved = true;

    return Promise.resolve(state);
  }

  // the rest of the request data from this point on is all optional
  request.GenerateRequest.MerchantReference = prefixEnv(applicationReferenceNumber);

  if (deliveryName) {
    request.GenerateRequest.TxnData1 = htmlencode.encode(deliveryName);
  }

  if (emailAddress) {
    request.GenerateRequest.EmailAddress = htmlencode.encode(emailAddress);
  }

  const { line1, suburbTownPostCode, countryCode } = deliveryAddress || {};
  if (line1 && suburbTownPostCode) {
    request.GenerateRequest.TxnData2 = htmlencode.encode(line1 + ', ' + suburbTownPostCode);
  }

  if (countryCode) {
    request.GenerateRequest.TxnData3 = htmlencode.encode(countryCode);
  }

  state.auditExtras.txnAttempted = true;

  // now the request is formed, return the fetch chain
  return pxpayGenerateRequestAPI(request)
    .then(result => {
      if (
          !result.Request.URI ||
          result.Request.URI.length !== 1 ||
          result.Request['$'].valid === '0'
        ) {
        // we failed to generate the request properly
        // for some reason the error shows up IN the URI field in some cases
        state.auditExtras.txnMessage = result.Request.URI ? result.Request.URI[0] : result.Request.ResponseText[0];

        let err500 = new Error('500 internal error - bad pxpay request');
        err500.statusCode = 500;

        throw err500;
      }

      state.responseBody.paymentURL = result.Request.URI[0];
      return Promise.resolve(state);
    });
};
