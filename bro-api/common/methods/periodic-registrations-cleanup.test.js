/* global fetch */
'use strict';

const periodicTask = require('./periodic-registrations-cleanup.js');

let mockBirthRegistrationsTable = [];
let mockAuditTable = [];
let auditTablePK = 0;
const MS_PER_MINUTE = 60000;

// set up a mock for the DB functions
const appMock = {
  models: {
    BirthRegistrationApplication: {
      beginTransaction: (options, fn) => {
        fn(null, {
          // basic fake txn functions - can be overridden
          commit: () => { return null; },
          observe: () => { return null; },
          rollback: () => { return null; }
        });
      },
      Transaction: {
        READ_COMMITTED: null
      },
      find: (filters, fn) => {
        let result = [];

        mockBirthRegistrationsTable.forEach(row => {
          if (
            row.submittedAt < filters.where['submittedAt']['lt'] &&
            row.eServerRejected === filters.where['eServerRejected']
          ) {
            result.push(row);
          }
        });

        fn(null, result);
      },
      destroyById: (id, txn, fn) => {
        let tableIndex;

        mockBirthRegistrationsTable.forEach((row, index) => {
          if (row.id === id) {
            tableIndex = index;
          }
        });

        mockBirthRegistrationsTable.splice(tableIndex, 1);

        fn(null);
      },
      upsert: (row, fn) => {
        fn(null, row);
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
        warn: () => { return null; },
        info: () => { return null; }
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
      submittedAt: new Date(new Date().getTime() - (40 * MS_PER_MINUTE)),
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
      processed: false,
      eServerRejected: false,
      confirmUrlSuccess: 'http://example.com/success',
      confirmUrlFail: 'http://example.com/fail'
    },
    {
      id: 1,
      submittedAt: new Date(),
      applicationReferenceNumber: '01081X',
      body: {},
      processed: false,
      eServerRejected: false,
      confirmUrlSuccess: 'http://example.com/success',
      confirmUrlFail: 'http://example.com/fail'
    },
    {
      id: 2,
      submittedAt: new Date(new Date().getTime() - (35 * MS_PER_MINUTE)),
      applicationReferenceNumber: '638M1M',
      body: {},
      processed: true,
      eServerRejected: false,
      confirmUrlSuccess: 'http://example.com/success',
      confirmUrlFail: 'http://example.com/fail'
    },
    {
      id: 3,
      submittedAt: new Date(new Date().getTime() - (35 * MS_PER_MINUTE)),
      applicationReferenceNumber: 'L1JL1Z',
      body: {},
      processed: false,
      eServerRejected: true,
      confirmUrlSuccess: 'http://example.com/success',
      confirmUrlFail: 'http://example.com/fail'
    }
  ];
  // reset the fetch mocks
  fetch.resetMocks();
});

describe('scheduled application POST task', () => {

  describe('finds applications created more than 30 minutes ago', () => {
    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        status: 'complete',
        duplicate: false
      }));
    });

    test('POSTs the application to the eServer', done => {
      // setTimeout 0 to run in a next tick
      setTimeout(() => {
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
              }
            }),
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        return done();
      }, 0);

      periodicTask(appMock);
    });

    test('creates an audit row', done => {
      setTimeout(() => {
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
          requestSource: 'txnTimeout',
          txnAttempted: true,
          txnReconciled: false,
          txnSuccess: false
        });
        return done();
      }, 0);

      periodicTask(appMock);
    });

    test('deletes the POSTed application and any processed applications', done => {
      setTimeout(() => {
        expect(mockBirthRegistrationsTable.length).toBe(2);
        return done();
      }, 0);
      periodicTask(appMock);
    });

    test('does not try to submit application that has been rejected already', done => {
      setTimeout(() => {
        // first record that hasn't been submitted before
        // should become rejected
        expect(fetch).toHaveBeenCalledTimes(1);
        return done();
      }, 0); // next tick

      periodicTask(appMock);
    });

    test('does not delete the application if it does not get submitted properly', done => {
      fetch.mockResponse(JSON.stringify({
        status: 'invalid'
      }));

      setTimeout(() => {
        expect(mockBirthRegistrationsTable[0].eServerRejected).toBe(true);
        return done();
      }, 0); // next tick

      periodicTask(appMock);
    });

  });

});
