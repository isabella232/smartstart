'use strict';

const { Response, Headers, Request } = require('node-fetch');
// note ^ we have to explicity use node-fetch not fetch-retry or isomorphic-fetch for this setup

global.Response = Response;
global.Headers = Headers;
global.Request = Request;

global.fetch = require('jest-fetch-mock');
