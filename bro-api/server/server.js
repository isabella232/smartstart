'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');
const path = require('path');
const appConfig = require('./app-config.js');
if (('sentryDsn' in appConfig)) {
  var Raven = require('raven');
  Raven.config(appConfig.sentryDsn, appConfig.sentryOptions).install();
}

var app = module.exports = loopback();

app.start = () => {
  // start the web server
  return app.listen(() => {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

let bootOptions = {
  appRootDir: __dirname,
  bootScripts: []
};

// only add the periodic tasks scheduler if we ran server.js directly
if (require.main === module)  {
  bootOptions.bootScripts.push(path.join(__dirname, './custom-boot/periodic.js'));
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, bootOptions, (err) => {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();

    // disable all caching - in particular to prevent an IE problem with the csrf token cookie on 304 requests
    // TODO: consider enabling caching of countries and birth-facilities endpoints now that csrf check has been removed
    app.disable('etag');
  }
});
