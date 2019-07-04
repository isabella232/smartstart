#!/usr/bin/env node

'use strict';

// NOTE: this is destructive and will drop all current data
// This just creates or recreates the tables for the models: for a method of
// also creating test data see
// https://github.com/strongloop/loopback-example-database/blob/postgresql/bin/automigrate.js

var path = require('path');
var argv = require('yargs').argv;
var app = require(path.resolve(__dirname, '../server/server'));
var ds = app.datasources.db;

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
    // note, although model name MUST start with a capital, postgres creates all tables in lowercase
    ds.discoverSchemas(model.toLowerCase(), (err) => {
      if (err || argv.force) {
        if (err) {
          console.log(model, 'table does not exist.');
        } else {
          console.log('--force mode is on,', model, 'table will be recreated.');
        }

        ds.automigrate(model, (err) => {
          if (err) throw err;

          console.log(model, 'table created.');

          operationCount = operationCount - 1;
          checkIfDone();
        });
      } else {
        console.log(model, 'table already exists - skipping.');

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
