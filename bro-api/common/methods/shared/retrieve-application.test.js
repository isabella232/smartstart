/* global fetch */
'use strict';

const retrieveApplication = require('./retrieve-application.js');
const appConfig = require('../../../server/app-config.js');

let mockBirthRegistrationsTable = [];
let mockAuditTable = [];
let stateMock = {
  body: {},
  responseBody: {},
  auditExtras: {}
};

jest.mock('../../../server/server', () => {
  let auditTablePK = 0;

  return {
    models: {
      BirthRegistrationApplication: {
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
jest.mock('../../utils/fetch-retry', () => {
  return require('jest-fetch-mock');
});

beforeEach(() => {
  stateMock = {
    tx: {
      rollback: () => {}
    },
    auditExtras: {}

  };

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
    }];

});

describe('retrieves the application from the store', () => {
  beforeEach(() => {
    fetch.mockResponseOnce(JSON.stringify({
      status: 'complete'
    }));
  });

  test('can retrieve record', () => {
    stateMock.applicationReferenceNumber = '41GR3M';

    expect(stateMock.record).toBeUndefined();
    retrieveApplication(stateMock);

    expect(stateMock.record).toEqual(expect.objectContaining({
      applicationReferenceNumber: '41GR3M'
    }));
  });

  test(`returns a 410 if it can't find a matching record`, () => {
    stateMock.applicationReferenceNumber = 'WRL7V5';

    retrieveApplication(stateMock).catch(error => {
      expect(error.statusCode).toBe(410);
    });
  });
});
