'use strict';

const birthFacilitiesAPI = require('../interfaces/birth-facilities.js');
const countriesAPI = require('../interfaces/countries.js');
const log = require('../utils/logger.js');
const formatError = require('../utils/format-error.js');

module.exports = function(ReferenceData) {

  /**
   * Retrieves a list of hospitals and other official medical places of birth

   * @callback {Function} callback Callback function
   * @param {Error|string} err Error object
   * @param {any} result Result object
   */
  ReferenceData.getBirthFacilities = (callback) => {
    process.nextTick(() => {

      birthFacilitiesAPI()
        .then(json => {
          return callback(null, json);
        })
        .catch(error => {
          log.error(formatError(error));
          return callback(error);
        });

    });
  };

  /**
   * List of countries and codes, as supported within Vitalware (and beyond)

   * @callback {Function} callback Callback function
   * @param {Error|string} err Error object
   * @param {any} result Result object
   */
  ReferenceData.getCountries = (callback) => {
    process.nextTick(() => {

      countriesAPI()
        .then(json => {
          return callback(null, json);
        })
        .catch(error => {
          log.error(formatError(error));
          return callback(error);
        });

    });
  };

  ReferenceData.remoteMethod('getBirthFacilities', {
    isStatic: true,
    accepts: [],
    returns: { arg: 'response', type: 'object' },
    http: { verb: 'get', path: '/birth-facilities' },
    description: 'Retrieves a list of hospitals and other official medical places of birth'
  });

  ReferenceData.remoteMethod('getCountries', {
    isStatic: true,
    accepts: [],
    returns: { arg: 'response', type: 'object' },
    http: { verb: 'get', path: '/countries' },
    description: 'List of countries and codes, as supported within Vitalware (and beyond)'
  });
};
