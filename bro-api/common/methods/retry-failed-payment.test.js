/* global fetch */
'use strict';

const retryFailedPayment = require('./retry-failed-payment.js');

let mockBirthRegistrationsTable = [];
let mockAuditTable = [];

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
    error: () => { return null; }
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
      childSurname: 'Warren',
      body: {
        'applicationReferenceNumber': '41GR3M',
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
          },
          'emailAddress': 'test@example.com'
        }
      },
      confirmUrlSuccess: 'http://example.com/success',
      confirmUrlFail: 'http://example.com/fail'
    },
    {
      id: 1,
      applicationReferenceNumber: '01081X',
      processed: true
    }
  ];
  // reset the fetch mocks
  fetch.resetMocks();
});

describe('/Births/birth-registrations/{applicationReferenceNumber}/retry-payment endpoint', () => {

  beforeEach(() => {
    // mock e-commerce response
    fetch.mockResponseOnce(`
      <Request valid="1">
        <URI>https://example.com</URI>
      </Request>
    `);
  });

  test('returns a 404 when the applicationReferenceNumber does not decode', done => {
    const applicationReferenceNumber = '';
    const callback = (error) => {
      expect(error.statusCode).toBe(404);
      done();
    };

    retryFailedPayment(applicationReferenceNumber, callback);
  });

  test(`redirects user to correct url`, done => {
    let callback = (error, responseBody) => {
      expect(responseBody.paymentURL).toEqual('https://example.com');
      done();
    };

    retryFailedPayment('41GR3M', callback);
  });

  test('updates submitted at date', done => {
    const THIRTY_MIN = 30 * 60 * 1000;
    const MOCK_DATE = new Date(1512697423000);
    mockBirthRegistrationsTable[0].submittedAt = MOCK_DATE;
    let callback = (error, responseBody) => {
      const diff = mockBirthRegistrationsTable[0].submittedAt - MOCK_DATE;
      // use greater rather than equals exactly
      // because processing takes time, and we can predict exact future time
      expect(diff).toBeGreaterThan(THIRTY_MIN);
      done();
    };

    retryFailedPayment('41GR3M', callback);
  });

  test('changes processed flag to false', done => {
    let callback = (error, responseBody) => {
      expect(mockBirthRegistrationsTable[1].processed).toBeFalsy();
      done();
    };

    expect(mockBirthRegistrationsTable[1].processed).toBeTruthy();
    retryFailedPayment('01081X', callback);
  });

  test('creates audit record on success', done => {
    expect(mockAuditTable.length).toEqual(0);
    let callback = (error, responseBody) => {
      expect(mockAuditTable.length).toEqual(1);
      expect(mockAuditTable[0]).toEqual(expect.objectContaining({
        submittedAt: expect.any(Date),
        surname: expect.any(String),
        applicationReferenceNumber: expect.any(String),
        requestSource: 'txnRetry'
      }));
      done();
    };

    retryFailedPayment('41GR3M', callback);
  });

  test('creates audit record on pxpay failure', done => {
    fetch.mockResponseOnce(`
      <Request valid="0">
        <URI>Bad Request</URI>
      </Request>
    `);

    expect(mockAuditTable.length).toEqual(0);

    let callback = (error, responseBody) => {
      expect(mockAuditTable.length).toEqual(1);
      expect(mockAuditTable[0]).toEqual(expect.objectContaining({
        submittedAt: expect.any(Date),
        surname: expect.any(String),
        applicationReferenceNumber: expect.any(String),
        requestSource: 'txnRetry'
      }));
      done();
    };

    retryFailedPayment('41GR3M', callback);
  });
});
