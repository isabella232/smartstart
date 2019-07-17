'use strict';

const request = require('request');
const fs = require('fs');
const appConfig = require('../app-config.js');
const log = require('../../common/utils/logger.js').child({ component: 'routes' });

module.exports = app => {
  // Proxy MyIR requests to IRD endpoints.
  // This is done to restrict what IRD requests can be made using our credentials
  // and to facilitate request logging.

  const router = app.loopback.Router();
  const baseOptions = {
    agentOptions: {
      cert: fs.readFileSync(`${appConfig.myirCertPath}/myir.client.crt`),
      key: fs.readFileSync(`${appConfig.myirCertPath}/myir.client.key`)
    },
    headers: {
      'FastSlice': appConfig.myirSliceHeader
    }
  };

  // forward req to MyIR and pipe its response to res
  function proxyMyIrRequest(req, res) {
    log.info({ 'myirRequestUrl': req.url, 'headers': req.headers }, 'MyIR request');

    let url = appConfig.myirUpstreamApi + req.url;
    let options = Object.assign({}, baseOptions, { method: req.method, url: url });
    let start = new Date();

    request(options).on('response', (response) => {
      log.info({
        'myirResponseStatus': response.statusCode,
        'duration': new Date() - start,
        'myirRequestUrl': req.url
      }, 'MyIR response');
    }).on('error', (error) => {
      log.error(error);
    }).pipe(res);
  }

  router.get('/validation/ping', (req, res) => {
    proxyMyIrRequest(req, res);
  });

  router.get('/validation/validate-ird-name', (req, res) => {
    proxyMyIrRequest(req, res);
  });

  router.get('/eservices/ping', (req, res) => {
    proxyMyIrRequest(req, res);
  });

  router.get('/eservices/myir-logon-reservation', (req, res) => {
    proxyMyIrRequest(req, res);
  });

  router.post('/eservices/myir-logon-reservation', (req, res) => {
    proxyMyIrRequest(req, res);
  });

  app.use('/birth-registration-api/myir', router);
};
