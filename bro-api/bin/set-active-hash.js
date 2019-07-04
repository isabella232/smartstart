'use strict';

// db must be set up before this script can be run
// the hash is used to determine if this instance should run periodic tasks
// this script should only be run upon initial env creation
const app = require('../server/server');
const appConfig = require('../server/app-config.js');

if (!appConfig.activeHash) {
  let error = new Error('Active hash not set in config');
  throw error;
}

let record = {
  'hash': appConfig.activeHash
};

// findOrCreate returns the first record if it exists. if it doesn't it creates it.
app.models.ActiveHash.findOrCreate(
  { where: {} }, // the empty where makes it return the first record
  record,
  (error, record) => {
    if (error) throw error;

    // if it DOES already exist, we need to update it
    if (record) {
      record.hash = appConfig.activeHash;
      app.models.ActiveHash.upsert(
        record,
        error => {
          if (error) throw error;
          process.exit();
        }
      );
    } else {
      process.exit();
    }
  }
);
