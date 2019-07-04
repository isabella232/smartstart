/* global fetch */
'use strict';

const getBirthRegistrationsPayments = require('./get-pxpay-txn.js');

let mockBirthRegistrationsTable = [];
let mockAuditTable = [];

// mock e-commerce result response (minimum required data)
const pxpayResponse = `
  <Response valid="1">
    <DpsTxnRef>000000034415e949</DpsTxnRef>
    <CardNumber>411111........11</CardNumber>
    <CardHolderName>TEST</CardHolderName>
    <ResponseText>APPROVED</ResponseText>
    <Success>1</Success>
    <CurrencySettlement>NZD</CurrencySettlement>
    <AmountSettlement>60.00</AmountSettlement>
    <DateSettlement>20170629</DateSettlement>
    <AuthCode>173415</AuthCode>
  </Response>
`;

// set up a mock for the DB functions
jest.mock('../../server/server', () => {
  let auditTablePK = 0;

  return {
    models: {
      BirthRegistrationApplication: {
        beginTransaction: (options, fn) => {
          fn(null, {
            // fake txn functions
            commit: () => { return null; },
            observe: () => { return null; },
            rollback: () => { return null; }
          });
        },
        Transaction: {
          SERIALIZABLE: null
        },
        findOne: (filters, txn, fn) => {
          let result;

          mockBirthRegistrationsTable.forEach(row => {
            if (
              row.applicationReferenceNumber === filters.where['applicationReferenceNumber']
            ) {
              result = row;
            }
          });

          fn(null, result);
        },
        upsert: (body, txnOrFn, fn) => {
          mockAuditTable.forEach(row => {
            if (row.id === body.id) {
              row = Object.assign(row, body);
            }
          });
          // need to handle upserts that both are and are not in a txn
          if (typeof txnOrFn === 'function') {
            txnOrFn(null);
          } else {
            fn(null);
          }
        }
      },
      Audit: {
        create: (body, fn) => {
          body.id = auditTablePK++;
          mockAuditTable.push(body);
          fn(null, body);
        }
      }
    }
  };
});

// setup fetch mock (see also setup-jest.js) - responses are set up beforeEach test
jest.mock('../utils/fetch-retry', () => {
  return require('jest-fetch-mock');
});

// setup logging mock
jest.mock('../utils/logger', () => {
  return {
    error: () => { return null; },
    child: (attr) => {
      return {
        error: () => { return null; },
        info: () => { return null; },
        child: () => {
          return {
            error: () => { return null; },
            info: () => { return null; },
            warn: () => { return null; }
          };
        }
      };
    }
  };
});

beforeEach(() => {
  // reset the "database"
  mockAuditTable = [];
  mockBirthRegistrationsTable = [
    {
      id: 0,
      submittedAt: new Date(),
      applicationReferenceNumber: '41GR3M',
      body: {
        'child': {
          'surname': 'Warren'
        },
        'certificateOrder': {
          'productCode': 'ZBFP',
          'quantity': 1,
          'courierDelivery': true,
          'deliveryName': 'J Bloggs',
          'deliveryAddress': {
            'line1': '31 Somestreet',
            'suburbTownPostCode': 'Wellington 6011',
            'countryCode': 'New Zealand'
          }
        }
      },
      confirmUrlSuccess: 'http://example.com/success',
      confirmUrlFail: 'http://example.com/fail'
    },
    {
      id: 1,
      applicationReferenceNumber: '01081X',
      body: {},
      confirmUrlSuccess: 'http://example.com/success',
      confirmUrlFail: 'http://example.com/fail'
    },
    {
      id: 2,
      applicationReferenceNumber: '638M1M',
      body: {},
      processed: true,
      confirmUrlSuccess: 'http://example.com/success',
      confirmUrlFail: 'http://example.com/fail'
    }
  ];
  // reset the fetch mocks
  fetch.resetMocks();
});

describe('/Births/birth-registrations/{applicationReferenceNumber}/payments/{state} endpoint', () => {

  describe('performs some basic checks', () => {

    test('returns a 404 when the applicationReferenceNumber does not decode', done => {
      let applicationReferenceNumber = '';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(error.statusCode).toBe(404);
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('returns a 404 when no result was provided', done => {
      let applicationReferenceNumber = '';
      let state = 'success';
      let result = '';
      let callback = (error) => {
        expect(error.statusCode).toBe(404);
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('returns a 404 when the status value is not success or fail', done => {
      let applicationReferenceNumber = '';
      let state = 'wrong';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(error.statusCode).toBe(404);
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });
  });

  describe('retrieves the application from the store', () => {
    beforeEach(() => {
      fetch.mockResponseOnce(pxpayResponse);

      fetch.mockResponseOnce(JSON.stringify({
        status: 'complete'
      }));
    });

    test(`returns a 410 if it can't find a matching record`, done => {
      let applicationReferenceNumber = 'Q1QK1Z';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(error.statusCode).toBe(410);
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('marks the application as processed in the store', done => {
      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(mockBirthRegistrationsTable.length).toBe(mockBirthRegistrationsTable.length);
        expect(mockBirthRegistrationsTable[0].applicationReferenceNumber).toBe('41GR3M');
        expect(mockBirthRegistrationsTable[0].processed).toBeTruthy();
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('skips and goes straight to redirect if application is already processed', done => {
      let applicationReferenceNumber = '638M1M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error, url, contentType) => {
        expect(url).toBe('http://example.com/success');
        expect(contentType).toBe('text/html; charset=utf-8');
        expect(mockAuditTable.length).toBe(0);
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });
  });

  describe('queries pxPay for the full txn result', () => {
    beforeEach(() => {
      fetch.mockResponseOnce(pxpayResponse);

      fetch.mockResponseOnce(JSON.stringify({
        status: 'complete'
      }));
    });

    test('forms an appropriate XML Response request', done => {
      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(fetch).toBeCalledWith(
          expect.any(String),
          {
            'body': expect.stringMatching(new RegExp(/\<Response\>pxpaytxnref\<\/Response\>/)),
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });
  });

  describe('sends the application and redirects to the frontend', () => {
    beforeEach(() => {
      fetch.mockResponseOnce(pxpayResponse);

      fetch.mockResponseOnce(JSON.stringify({
        status: 'complete'
      }));
    });

    test(`doesn't throw any errors when given proper inputs`, done => {
      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(error).toBeNull();
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('Does not post application to the eServer when transaction failed', done => {
      let applicationReferenceNumber = '41GR3M';
      let state = 'fail';
      let result = 'pxpaytxnref';
      let callback = (error) => {

        expect(fetch).toHaveBeenCalledTimes(1);
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('POSTs the application to the eServer when transaction successful', done => {
      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(fetch).toBeCalledWith(
          expect.any(String),
          {
            'body': JSON.stringify({
              'child': {
                'surname': 'Warren'
              },
              'certificateOrder': {
                'productCode': 'ZBFP',
                'quantity': 1,
                'courierDelivery': true,
                'deliveryName': 'J Bloggs',
                'deliveryAddress': {
                  'line1': '31 Somestreet',
                  'suburbTownPostCode': 'Wellington 6011',
                  'countryCode': 'New Zealand'
                }
              },
              'payment': {
                'paymentProviderResponse': {
                  'transactionReference': '000000034415e949',
                  'cardNumber': '411111........11',
                  'cardHolderName': 'TEST',
                  'responseText': 'APPROVED',
                  'Valid': '1',
                  'Success': 1,
                  'currencySettlement': 'NZD',
                  'amountSettlement': 60,
                  'dateSettlement': '2017-06-29',
                  'authCode': '173415'
                }
              }
            }),
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('redirects to the success url', done => {
      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error, url, contentType) => {
        expect(url).toBe('http://example.com/success');
        expect(contentType).toBe('text/html; charset=utf-8');
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('redirects to the failure url', done => {
      let applicationReferenceNumber = '41GR3M';
      let state = 'fail';
      let result = 'pxpaytxnref';
      let callback = (error, url, contentType) => {
        expect(url).toBe('http://example.com/fail');
        expect(contentType).toBe('text/html; charset=utf-8');
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });
  });

  describe('creates an audit row', () => {
    test('when everything goes OK (with all the relevant information)', done => {
      fetch.mockResponseOnce(pxpayResponse);

      fetch.mockResponseOnce(JSON.stringify({
        status: 'complete'
      }));

      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(mockAuditTable.length).toBe(1);
        expect(mockAuditTable[0]).toEqual({
          id: expect.any(Number),
          applicationReferenceNumber: expect.any(String),
          submittedAt: expect.any(Date),
          surname: expect.any(String),
          localDuplicate: false,
          deliveryAddress: expect.any(Object),
          deliveryName: expect.any(String),
          productCode: expect.any(String),
          quantity: expect.any(Number),
          eServerDuplicate: false,
          eServerResponseStatus: 'complete',
          eServerSubmittedAt: expect.any(Date),
          requestSource: 'txnComplete',
          txnAttempted: true,
          txnMessage: expect.any(String),
          txnReconciled: true,
          txnSuccess: true
        });
        expect(error).toBe(null);
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('when getting the Reponse from pxPay goes wrong', done => {
      fetch.mockResponses(
        [{}, { status: 404 }]
      );

      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(mockAuditTable.length).toBe(1);
        expect(error).toBe(null);
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('when submitting to the eServer goes wrong', done => {
      fetch.mockResponseOnce(pxpayResponse);

      fetch.mockResponseOnce(JSON.stringify({
        status: 'invalid'
      }));

      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(mockAuditTable.length).toBe(1);
        expect(error).toBe(null);
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });
  });

  describe('resets the application processed state', () => {
    test('when getting the Reponse from pxPay goes wrong', done => {
      fetch.mockResponses(
        [{}, { status: 404 }]
      );

      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(mockBirthRegistrationsTable.length).toBe(mockBirthRegistrationsTable.length);
        expect(mockBirthRegistrationsTable[0].applicationReferenceNumber).toBe('41GR3M');
        expect(mockBirthRegistrationsTable[0].processed).toBeFalsy();
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });

    test('when submitting to the eServer goes wrong', done => {
      fetch.mockResponses(
        [pxpayResponse, { status: 200 }],
        [{}, { status: 502 }]
      );

      let applicationReferenceNumber = '41GR3M';
      let state = 'success';
      let result = 'pxpaytxnref';
      let callback = (error) => {
        expect(mockBirthRegistrationsTable.length).toBe(mockBirthRegistrationsTable.length);
        expect(mockBirthRegistrationsTable[0].applicationReferenceNumber).toBe('41GR3M');
        // check the payment details got written
        expect(mockBirthRegistrationsTable[0].body.payment.paymentProviderResponse.Success).toBe(1);
        // check processed got reset
        expect(mockBirthRegistrationsTable[0].processed).toBeFalsy();
        done();
      };

      getBirthRegistrationsPayments(applicationReferenceNumber, state, result, callback);
    });
  });
});
