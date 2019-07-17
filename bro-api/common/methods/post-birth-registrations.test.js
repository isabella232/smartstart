/* global fetch */
'use strict';

const postBirthRegistrations = require('./post-birth-registrations.js');
const appConfig = require('../../server/app-config.js');

let mockBirthRegistrationsTable = [];
let mockAuditTable = [];
let mockOptions = {
  referer: 'https://example.com/referer-website-path'
};
let mockRequest = {
  'headers': {
    'x-real-ip': '127.0.0.1'
  }
};

// set up a mock for the DB functions
jest.mock('../../server/server', () => {
  let auditTablePK = 0;

  return {
    models: {
      BirthRegistrationApplication: {
        create: (body, fn) => {
          body.id = 0;
          mockBirthRegistrationsTable.push(body);
          fn(null, body);
        },
        findOne: (filters, fn) => {
          let result;

          mockBirthRegistrationsTable.forEach(row => {
            if (
              row.childFirstNames === filters.where['childFirstNames'] &&
              row.childSurname === filters.where['childSurname'] &&
              row.childBirthDate === filters.where['childBirthDate']
            ) {
              result = row;
            }
          });

          fn(null, result);
        }
      },
      Audit: {
        create: (body, fn) => {
          body.id = auditTablePK++;
          mockAuditTable.push(body);
          fn(null, body);
        },
        upsert: (body, fn) => {
          mockAuditTable.forEach(row => {
            if (row.id === body.id) {
              row = Object.assign(row, body);
            }
          });
          fn(null);
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
    debug: () => { return null; },
    child: (attr) => {
      return {
        error: () => { return null; },
        info: () => { return null; },
        warn: () => { return null; },
        debug: () => { return null; }
      };
    }
  };
});

beforeEach(() => {
  // reset the "database"
  mockBirthRegistrationsTable = [];
  mockAuditTable = [];
  // reset the fetch mocks
  fetch.resetMocks();
});

describe('/Births/birth-registrations endpoint', () => {

  describe('has basic checks for malformed requests', () => {
    test('returns a 400 when the body is empty', done => {
      let body = {};
      let callback = (error, response) => {
        expect(error.statusCode).toBe(400);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test('returns a 400 when the body is not an object', done => {
      let body = [];
      let callback = (error, response) => {
        expect(error.statusCode).toBe(400);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test('returns a 400 when a certificate is required but no redirect urls are supplied', done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        }
      };
      let callback = (error, response) => {
        expect(error.statusCode).toBe(400);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('applies appropriate transformations to incoming data', () => {
    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        status: 'invalid',
        errors: []
      }));
    });

    test('submissions with no activity are treated as fullSubmission', done => {
      let body = {
        something: 'bogus'
      };
      let callback = (error, response) => {
        expect(fetch).toBeCalledWith(
          expect.any(String),
          {
            'body': expect.stringContaining('fullSubmission'),
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test('some fields get transformed to Title Case', done => {
      let body = {
        activity: 'validateOnly',
        'child': {
          'ethnicGroups': {
            'other': 'IS this TiTle CASE yet?'
          }
        },
        'birthPlace': {
          'other': 'IS this TiTle CASE yet?'
        },
        'mother': {
          'ethnicGroups': {
            'other': 'IS this TiTle CASE yet?'
          }
        },
        'father': {
          'ethnicGroups': {
            'other': 'IS this TiTle CASE yet?'
          }
        }
      };
      let callback = (error, response) => {
        expect(fetch).toBeCalledWith(
          expect.any(String),
          {
            'body': expect.stringMatching(/(Is This Title Case Yet\?).*(\1).*(\1).*(\1)/g),
            // each .*(\1) indicates 'any number of characters then the first group repeats'
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test('removes confirmation address from request body', done => {
      let body = {
        activity: 'fullSubmission',
        confirmationEmailAddress: 'email@a'
      };
      let callback = (error, response) => {
        expect(body).not.toHaveProperty('confirmationEmailAddress');
        expect(fetch).toHaveBeenCalledTimes(1);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('checks for locally stored duplicates', () => {
    beforeEach(() => {
      fetch.mockResponseOnce(JSON.stringify({
        status: 'valid'
      }));

      fetch.mockResponseOnce(`
        <Request valid="1">
          <URI>https://example.com</URI>
        </Request>
      `);

      fetch.mockResponseOnce(JSON.stringify({
        status: 'valid'
      }));

      fetch.mockResponseOnce(`
        <Request valid="1">
          <URI>https://example.com</URI>
        </Request>
      `);
    });

    test(`if there are duplicate sumissions present in the API datastore, a 400
      and duplicate: true is returned`, done => {
      let body = {
        'child': {
          'firstNames': 'Joe',
          'surname': 'Bloggs',
          'birthDate': '2017-05-25'
        },
        'certificateOrder': {  // cert order ensures it is saved locally
          'productCode': 'ZBBC',
          'quantity': 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let setupCallback = (error, response) => {
        expect(mockBirthRegistrationsTable.length).toBe(1);

        // now we've added a record, try adding the same one again
        postBirthRegistrations(body, mockRequest, mockOptions, callback);
      };
      let callback = (error, response) => {
        expect(error).toEqual(expect.objectContaining({
          statusCode: 400,
          duplicate: true
        }));
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, setupCallback);
    });

    test(`that multiple applications can be saved to the datastore when they
      are not duplicates`, done => {
      let body1 = {
        'child': {
          'firstNames': 'Joe',
          'surname': 'Bloggs',
          'birthDate': '2017-05-25'
        },
        'certificateOrder': {  // cert order ensures it is saved locally
          'productCode': 'ZBBC',
          'quantity': 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let body2 = {
        'child': {
          'firstNames': 'Joey',
          'surname': 'Bloggs',
          'birthDate': '2017-05-25'
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let setupCallback = (error, response) => {
        expect(mockBirthRegistrationsTable.length).toBe(1);

        // now we've added a record, try adding a slightly different one
        postBirthRegistrations(body2, mockRequest, mockOptions, callback);
      };
      let callback = (error, response) => {
        expect(error).toBeNull();
        expect(response.duplicate).toBeFalsy();
        done();
      };

      postBirthRegistrations(body1, mockRequest, mockOptions, setupCallback);
    });
  });

  describe(`prevents fullSubmission posts that have a cert order from being
    immediately submitted`, () => {
    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        status: 'valid'
      }));
    });

    test('the post to eServer should not have an activity of fullSubmission', done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(fetch).toBeCalledWith(
          expect.any(String),
          {
            'body': expect.stringContaining('validateOnly'),
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('creates an audit record', () => {
    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        status: 'valid'
      }));
    });

    test('creates an audit record for fullSubmissions', done => {
      let body = {
        activity: 'fullSubmission'
      };
      let callback = (error, response) => {
        expect(mockAuditTable.length).toBe(1);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test('does not create an audit record for validateOnly', done => {
      let body = {
        activity: 'validateOnly'
      };
      let callback = (error, response) => {
        expect(mockAuditTable.length).toBe(0);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test('stores information about the submission in the audit record', done => {
      let body = {
        'activity': 'fullSubmission',
        'child': {
          'surname': 'Smith'
        },
        'certificateOrder': {
          'productCode': 'ZBFP',
          'quantity': 1,
          'deliveryName': 'J Smith',
          'deliveryAddress': {
            'line1': '31 Somestreet',
            'suburbTownPostCode': 'Wellington 6011',
            'countryCode': 'New Zealand'
          }
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(mockAuditTable[0]).toEqual({
          applicationReferenceNumber: expect.any(String),
          id: expect.any(Number),
          submittedAt: expect.any(Date),
          surname: 'Smith',
          requestSource: 'https://example.com/referer-website-path',
          productCode: 'ZBFP',
          quantity: 1,
          deliveryName: 'J Smith',
          deliveryAddress: expect.any(Object),
          eServerDuplicate: false,
          eServerResponseStatus: 'valid',
          eServerSubmittedAt: expect.any(Date),
          localDuplicate: false,
          txnAttempted: true,
          txnReconciled: false
        });
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('posts to the eServer and returns validation errors', () => {
    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        status: 'invalid',
        errors: [
          {
            'code': 'POBH_Mandatory',
            'field': 'hospital',
            'message': ''
          }
        ]
      }));
    });

    test(`invalid responses from the eServer trigger a 400 response
      with errors passed along (when validating only)`, done => {
      let body = {
        activity: 'validateOnly'
      };
      let callback = (error, response) => {
        expect(error).toEqual(expect.objectContaining({
          statusCode: 400,
          errors: expect.any(Array),
          status: 'invalid'
        }));
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test(`invalid responses from the eServer trigger a 400 response
      with errors passed along (when submitting)`, done => {
      let body = {
        activity: 'fullSubmission'
      };
      let callback = (error, response) => {
        expect(error).toEqual(expect.objectContaining({
          statusCode: 400,
          errors: expect.any(Array),
          status: 'invalid'
        }));
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test(`invalid responses from the eServer trigger a 400 response
      with errors passed along (when submitting with a certificate)`, done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(error).toEqual(expect.objectContaining({
          statusCode: 400,
          errors: expect.any(Array),
          status: 'invalid'
        }));
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('posts to the eServer and returns duplicate errors', () => {
    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        status: 'valid',
        duplicate: true,
        errors: [
          {
            'code': 'name_contains_rank',
            'field': 'child.firstnames',
            'message': ''
          }
        ]
      }));
    });

    test(`duplicate responses from the eServer trigger a 400 response
      with errors passed along (when validating only)`, done => {
      let body = {
        activity: 'validateOnly'
      };
      let callback = (error, response) => {
        expect(error).toEqual(expect.objectContaining({
          statusCode: 400,
          errors: expect.any(Array),
          duplicate: true
        }));
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test(`duplicate responses from the eServer trigger a 400 response
      with errors passed along (when submitting)`, done => {
      let body = {
        activity: 'fullSubmission'
      };
      let callback = (error, response) => {
        expect(error).toEqual(expect.objectContaining({
          statusCode: 400,
          errors: expect.any(Array),
          duplicate: true
        }));
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test(`duplicate responses from the eServer trigger a 400 response
      with errors passed along (when submitting with a certificate)`, done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(error).toEqual(expect.objectContaining({
          statusCode: 400,
          errors: expect.any(Array),
          duplicate: true
        }));
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe(`posts to the eServer and returns 'valid' and any warnings`, () => {
    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        status: 'valid',
        errors: [
          {
            'code': 'name_contains_rank',
            'field': 'child.firstnames',
            'message': ''
          }
        ]
      }));
    });

    test(`validateOnly posts that came back as valid return a 200 and any warnings
      (with no certificate order)`, done => {
      let body = {
        activity: 'validateOnly',
        certificateOrder: {
          quantity: 0
        }
      };
      let callback = (error, response) => {
        expect(response).toEqual(expect.objectContaining({
          errors: expect.any(Array),
          status: 'valid'
        }));
        expect(response.paymentURL).toBeUndefined();
        expect(mockBirthRegistrationsTable.length).toBe(0);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test(`validateOnly posts that came back as valid return a 200 and any warnings
      (with a certificate order)`, done => {
      let body = {
        activity: 'validateOnly',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(response).toEqual(expect.objectContaining({
          errors: expect.any(Array),
          status: 'valid'
        }));
        expect(response.paymentURL).toBeUndefined();
        expect(mockBirthRegistrationsTable.length).toBe(0);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('submits applications with no cert required to the eServer', () => {
    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        status: 'complete',
        errors: [
          {
            'field': 'child.firstnames',
            'message': ''
          }
        ]
      }));
    });

    test('fullSubmission posts with no cert order return a 200 and any warnings and an application ID', done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          quantity: 0
        }
      };
      let callback = (error, response) => {
        expect(response).toEqual(expect.objectContaining({
          errors: expect.any(Array),
          status: 'complete',
          applicationReferenceNumber: expect.any(String)
        }));
        expect(response.paymentURL).toBeUndefined();

        let regex = [
          '\\"activity\\":\\"fullSubmission\\"',
          '\\"certificateOrder\\":{\\"quantity\\":0}',
          '\\"applicationReferenceNumber'
        ];
        expect(fetch).toBeCalledWith(
          expect.any(String),
          {
            'body': expect.stringMatching(new RegExp(regex.join(','))),
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        expect(mockBirthRegistrationsTable.length).toBe(0);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('stores applications with cert orders, and triggers payment', () => {
    beforeEach(() => {
      // mock the validation POST
      fetch.mockResponseOnce(JSON.stringify({
        status: 'valid',
        errors: [
          {
            'field': 'child.firstnames',
            'message': ''
          }
        ]
      }));

      // mock e-commerce response
      fetch.mockResponseOnce(`
        <Request valid="1">
          <URI>https://example.com</URI>
        </Request>
      `);
    });

    test('fullSubmission posts with a cert order are saved to DB', done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(mockBirthRegistrationsTable.length).toBe(1);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test('fullSubmission posts with a cert order triggers a pxPay request', done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(fetch).toBeCalledWith(
          expect.any(String),
          {
            'body': expect.stringMatching(/\<TxnType\>Purchase\<\/TxnType\>/),
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test(`fullSubmission posts with a cert order have their extra data for
      pxPay urlencoded and processed`, done => {
      let body = {
        'activity': 'fullSubmission',
        'certificateOrder': {
          'productCode': 'ZBFP',
          'quantity': 1,
          'courierDelivery': true,
          'deliveryName': 'J & B Bloggs',
          'deliveryAddress': {
            'line1': '31 Somestreet',
            'suburbTownPostCode': 'London SE1 7PB',
            'countryCode': 'GBR'
          },
          'emailAddress': 'test@example.com'
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        let regex = [
          `\\<MerchantReference\\>${appConfig.pxPayTxnIdPrefix}-([ABCDFGHJKLMNPQRSTVWXYZ0123456789]){6}\\<\\/MerchantReference\\>`,
          '\\<TxnData1\\>J \\&amp\;\\#x26\\; B Bloggs\\<\\/TxnData1\\>',
          '\\<EmailAddress\\>test\\@example.com\\<\\/EmailAddress\\>',
          '\\<TxnData2\\>31 Somestreet\\, London SE1 7PB\\<\\/TxnData2\\>',
          '\\<TxnData3\\>GBR\\<\\/TxnData3\\>'
        ];
        expect(fetch).toBeCalledWith(
          expect.any(String),
          {
            'body': expect.stringMatching(new RegExp(regex.join('\\s*'))),
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test('adds a timeout to the pxPay transaction', done => {
      let body = {
        'activity': 'fullSubmission',
        'certificateOrder': {
          'productCode': 'ZBFP',
          'quantity': 1,
          'courierDelivery': true,
          'deliveryName': 'J & B Bloggs',
          'deliveryAddress': {
            'line1': '31 Somestreet',
            'suburbTownPostCode': 'London SE1 7PB',
            'countryCode': 'GBR'
          },
          'emailAddress': 'test@example.com'
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(fetch).toBeCalledWith(
          expect.any(String),
          {
            'body': expect.stringMatching(new RegExp(/\<Opt\>TO=(\d){10}\<\/Opt\>/)),
            'headers': expect.any(Object),
            'method': 'POST'
          }
        );
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test(`fullSubmission posts with a cert order returns 200, warnings,
      application ID and pxPay redirect URL`, done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(response).toEqual(expect.objectContaining({
          errors: expect.any(Array),
          status: 'complete',
          paymentURL: 'https://example.com',
          applicationReferenceNumber: expect.any(String)
        }));
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('deals with incorrect product codes', () => {
    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        status: 'valid'
      }));
    });

    test('invalid product codes do not trigger a pxPay request', done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'bogus',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(error.statusCode).toBe(400);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('deals with failures to connect to the eServer', () => {
    beforeEach(() => {
      fetch.mockResponses(
        [{}, { status: 404 }]
      );
    });

    test('returns the status from the eServer api call and writes to the audit log', done => {
      let body = {
        activity: 'fullSubmission'
      };
      let callback = (error, response) => {
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Not Found');
        expect(mockAuditTable[0]).toEqual({
          id: expect.any(Number),
          submittedAt: expect.any(Date),
          surname: expect.any(String),
          requestSource: expect.any(String),
          localDuplicate: false,
          applicationReferenceNumber: expect.any(String),
          eServerSubmittedAt: expect.any(Date)
        });
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });

    test(`returns the status from the eServer api call but doesn't write to the
      audit log if it wasn't a fullSubmission`, done => {
      let body = {
        activity: 'validateOnly'
      };
      let callback = (error, response) => {
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Not Found');
        expect(mockAuditTable.length).toBe(0);
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('deals with failures to connect to the payment server', () => {
    beforeEach(() => {
      fetch.mockResponses(
        [JSON.stringify({ status: 'valid' }), { status: 200 }],
        [{}, { status: 404 }]
      );
    });

    test('returns the status from the pxPay api call and writes to the audit log', done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Not Found');
        expect(mockAuditTable[0]).toEqual({
          id: expect.any(Number),
          submittedAt: expect.any(Date),
          surname: expect.any(String),
          requestSource: expect.any(String),
          productCode: 'ZBBC',
          quantity: 1,
          localDuplicate: false,
          applicationReferenceNumber: expect.any(String),
          eServerSubmittedAt: expect.any(Date),
          eServerResponseStatus: 'valid',
          eServerDuplicate: false,
          txnAttempted: true,
          txnReconciled: false
        });
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('deals with malformed responses from the payment server', () => {
    beforeEach(() => {
      fetch.mockResponses(
        [JSON.stringify({ status: 'valid' }), { status: 200 }],
        [`<Request valid="1">
            <URI>https://example.com</URI>
          </R>`, { status: 200 }]
      );
    });

    test('rejects the pxPay api call and dumps the malformed XML to the stack', done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(error.message).toBe('Unexpected error');
        expect(error.stack).toEqual(expect.stringMatching(/<\/R>/));
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('updates the audit record', () => {
    beforeEach(() => {
      // mock the validation POST
      fetch.mockResponseOnce(JSON.stringify({
        status: 'valid'
      }));

      // mock e-commerce response
      fetch.mockResponseOnce(`
        <Request valid="1">
          <URI>https://example.com</URI>
        </Request>
      `);
    });

    test(`adds applicationReferenceNumber, eServer response and pxPay
      transaction generation reponse details to the audit record`, done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(mockAuditTable[0]).toEqual({
          id: expect.any(Number),
          submittedAt: expect.any(Date),
          surname: expect.any(String),
          requestSource: expect.any(String),
          productCode: 'ZBBC',
          quantity: 1,
          localDuplicate: false,
          applicationReferenceNumber: expect.any(String),
          eServerSubmittedAt: expect.any(Date),
          eServerResponseStatus: 'valid',
          eServerDuplicate: false,
          txnAttempted: true,
          txnReconciled: false
        });
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });

  describe('thows an error when the payment server does not generate a URI', () => {
    beforeEach(() => {
      // mock the validation POST
      fetch.mockResponseOnce(JSON.stringify({
        status: 'valid'
      }));

      // mock e-commerce response
      fetch.mockResponseOnce(`
        <Request valid="1">
          <Reco>IP</Reco>
          <ResponseText>Invalid Access Info</ResponseText>
        </Request>
      `);
    });

    test(`records the error message from pxPay in the audit record`, done => {
      let body = {
        activity: 'fullSubmission',
        certificateOrder: {
          productCode: 'ZBBC',
          quantity: 1
        },
        'confirmationUrlSuccess': 'http://example.com/success',
        'confirmationUrlFailure': 'http://example.com/fail'
      };
      let callback = (error, response) => {
        expect(error.statusCode).toBe(500);
        expect(mockAuditTable[0]).toEqual({
          id: expect.any(Number),
          submittedAt: expect.any(Date),
          surname: expect.any(String),
          requestSource: expect.any(String),
          productCode: 'ZBBC',
          quantity: 1,
          localDuplicate: false,
          applicationReferenceNumber: expect.any(String),
          eServerSubmittedAt: expect.any(Date),
          eServerResponseStatus: 'valid',
          eServerDuplicate: false,
          txnAttempted: true,
          txnReconciled: false,
          txnMessage: 'Invalid Access Info'
        });
        done();
      };

      postBirthRegistrations(body, mockRequest, mockOptions, callback);
    });
  });
});
