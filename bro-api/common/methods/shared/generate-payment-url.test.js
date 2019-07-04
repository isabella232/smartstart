/* global fetch */
'use strict';

const generatePaymentURL = require('./generate-payment-url.js');
const appConfig = require('../../../server/app-config.js');

let stateMock = {
  body: {},
  responseBody: {},
  auditExtras: {}
};

// setup fetch mock (see also setup-jest.js) - responses are set up beforeEach test
jest.mock('../../utils/fetch-retry', () => {
  return require('jest-fetch-mock');
});

beforeEach(() => {
  stateMock = {
    body: {
      'applicationReferenceNumber': '41GR3M',
      'certificateOrder': {
        'productCode': 'ZBFP',
        'quantity': 1,
        'courierDelivery': true,
        'deliveryName': 'J Bloggs',
        'deliveryAddress': {
          'line1': '31 Somestreet',
          'suburbTownPostCode': 'Wellington 6011',
          'countryCode': 'New Zealand'
        },
        'emailAddress': 'test@example.com'
      }
    },
    record: {
      applicationReferenceNumber: '41GR3M'
    },
    responseBody: {},
    auditExtras: {}
  };
});

describe('PxPay request', () => {
  beforeEach(() => {
    fetch.mockResponseOnce(`
      <Request valid="1">
        <URI>https://example.com</URI>
      </Request>
    `);
  });
  test('does not create request if record is already resolved', () => {
    // mock resolved state
    stateMock.resolved = true;
    generatePaymentURL(stateMock);

    expect(stateMock.auditExtras.txnAttempted).toBe(false);
    expect(stateMock.responseBody.paymentURL).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(0);
  });

  test('does not call pxpay if no product or quantity', () => {
    // remove certificate order from default record mock
    delete stateMock.body.certificateOrder;

    generatePaymentURL(stateMock);
    expect(fetch).toHaveBeenCalledTimes(0);
  });

  test('triggers a pxPay request', () => {
    generatePaymentURL(stateMock);

    expect(fetch).toBeCalledWith(
      expect.any(String),
      {
        'body': expect.stringMatching(/\<TxnType\>Purchase\<\/TxnType\>/),
        'headers': expect.any(Object),
        'method': 'POST'
      }
    );
  });

  test('pxpay request has Amount and ID', () => {
    generatePaymentURL(stateMock);

    let regex = [
      '\\<AmountInput\\>60\\</AmountInput\\>',
      `\\<MerchantReference\\>${appConfig.pxPayTxnIdPrefix}-([ABCDFGHJKLMNPQRSTVWXYZ0123456789]){6}\\<\\/MerchantReference\\>`
    ];

    expect(fetch).toBeCalledWith(
      expect.any(String),
      {
        'body': expect.stringMatching(new RegExp(regex.join('\\s*'))),
        'headers': expect.any(Object),
        'method': 'POST'
      }
    );
  });

  test('pxpay request has address and email data', () => {
    generatePaymentURL(stateMock);

    let regex = [
      '\\<EmailAddress\\>test\\@example.com\\<\\/EmailAddress\\>',
      '\\<TxnData2\\>31 Somestreet\\, Wellington 6011\\<\\/TxnData2\\>',
      '\\<TxnData3\\>New Zealand\\<\\/TxnData3\\>'
    ];

    expect(fetch).toBeCalledWith(
      expect.any(String),
      {
        'body': expect.stringMatching(new RegExp(regex.join('\\s*'))),
        'headers': expect.any(Object),
        'method': 'POST'
      }
    );
  });

  test('pxpay request adds merchant reference for retry transactions', () => {

    generatePaymentURL(stateMock);

    let regex = [
      `\\<MerchantReference\\>${appConfig.pxPayTxnIdPrefix}-([ABCDFGHJKLMNPQRSTVWXYZ0123456789]){6}\\</MerchantReference\\>`
    ];

    expect(fetch).toBeCalledWith(
      expect.any(String),
      {
        'body': expect.stringMatching(new RegExp(regex.join('\\s*'))),
        'headers': expect.any(Object),
        'method': 'POST'
      }
    );
  });

  test('adds a timeout to the pxPay transaction', () => {
    generatePaymentURL(stateMock);

    expect(fetch).toBeCalledWith(
      expect.any(String),
      {
        'body': expect.stringMatching(new RegExp(/\<Opt\>TO=(\d){10}\<\/Opt\>/)),
        'headers': expect.any(Object),
        'method': 'POST'
      }
    );
  });
});

describe('PxPay fail', () => {
  test('throws error on response not valid', () => {
    fetch.mockResponseOnce(`
      <Request valid="0">
        <URI>Bad Request</URI>
      </Request>`);

    generatePaymentURL(stateMock).catch(e => {
      expect(e.statusCode).toEqual(500);
      expect(stateMock.auditExtras.txnMessage).toEqual('Bad Request');
    });
  });
});
