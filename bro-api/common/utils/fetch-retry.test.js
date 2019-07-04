/* global fetch */
'use strict';

const fetchRetry = require('./fetch-retry.js');

jest.mock('node-fetch', () => {
  return require('jest-fetch-mock');
});

describe('retries network requests', () => {
  test('when a status > 400 is received', () => {
    fetch.mockResponses(
      [{}, { status: 500 }],
      [{}, { status: 404 }],
      [{}, { status: 200 }]
    );

    expect.assertions(1);

    return fetchRetry('http://example.com')
      .then(result => expect(result.status).toEqual(200));
  });

  test('and gives up after 3 attempts by default', () => {
    fetch.mockResponses(
      [{}, { status: 500 }],
      [{}, { status: 404 }],
      [{}, { status: 401 }]
    );

    expect.assertions(1);

    return fetchRetry('http://example.com')
      .catch(err => expect(err.statusCode).toEqual(401));
  });

  test('with a configurable number of retries', () => {
    fetch.mockResponses(
      [{}, { status: 500 }],
      [{}, { status: 200 }]
    );

    expect.assertions(1);

    return fetchRetry('http://example.com', { retries: 1 })
      .then(result => expect(result.status).toEqual(200));
  });
});
