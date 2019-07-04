#!/usr/bin/env node

'use strict';

// NOTE: this is LoopBack's autoupdate feature
// https://loopback.io/doc/en/lb2/Creating-a-database-schema-from-models.html#auto-update
// It is *not* guaranteed to be perfect - look at proper migrations strategies
// if this is required for prod e.g. https://github.com/theoephraim/node-pg-migrate

const path = require('path');
const app = require(path.resolve(__dirname, '../server/server'));
const ds = app.datasources.db;

const models = Object.keys(app.models);
let operationCount = models.length;

const checkIfDone = () => {
  if (operationCount === 0) {
    ds.disconnect();
  }
};

if (operationCount === 0) {
  console.log('No models currently defined.');
  process.exit();
};

models.forEach(model => {
  if (app.models[model].settings.base === 'PersistedModel') {
    ds.isActual(model, (err, actual) => {
      if (!actual) {
        console.log(model, 'table is not up to date - updating...');

        ds.autoupdate(model, (err) => {
          if (err) throw err;

          console.log('...', model, 'table updated.');

          operationCount = operationCount - 1;
          checkIfDone();
        });
      } else {
        operationCount = operationCount - 1;
        checkIfDone();
      }
    });
  } else {
    // not a persisted model
    operationCount = operationCount - 1;
    checkIfDone();
  }
});

checkIfDone();
