'use strict';

const request = require('request');
const fs = require('fs');
const appConfig = require('../app-config.js');
const log = require('../../common/utils/logger.js').child({ component: 'routes' });

module.exports = app => {
  const router = app.loopback.Router();

  // we are redirecting requests to different route, which can access IRD endpoints
  // it's done only for the purpose of capturing LOGS
  router.all('/birth-registration-api/myir/*', (req, res) => {
    const options = {
      url: appConfig.myirUpstreamApi + req.url.replace('/birth-registration-api/myir', ''),
      agentOptions: {
        cert: fs.readFileSync(`${appConfig.myirCertPath}/myir.client.crt`),
        key: fs.readFileSync(`${appConfig.myirCertPath}/myir.client.key`)
      },
      headers: {
        'FastSlice': appConfig.myirSliceHeader
      }
    };

    log.info({ 'myirRequestUrl': req.url, 'headers': req.headers }, 'MyIR request');

    if (req.method === 'POST') {
      request.post(options).pipe(res);
    } else if (req.method === 'GET') {
      request.get(options).pipe(res);
    } else {
      res.status(405).send('Method not allowed');
    }
  });

  app.use(router);
};
