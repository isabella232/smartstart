import { checkStatus } from 'utils'
import fetchWithRetry from 'fetch-retry'
import get from 'lodash/get'

export const REQUEST_SCHEMA = 'REQUEST_SCHEMA'
export const RECEIVE_SCHEMA = 'RECEIVE_SCHEMA'
export const FAILURE_SCHEMA = 'FAILURE_SCHEMA'
export const REQUEST_ELIGIBILITY = 'REQUEST_ELIGIBILITY'
export const RECEIVE_ELIGIBILITY = 'RECEIVE_ELIGIBILITY'
export const FAILURE_ELIGIBILITY = 'FAILURE_ELIGIBILITY'
export const REQUEST_METADATA = 'REQUEST_METADATA'
export const RECEIVE_METADATA = 'RECEIVE_METADATA'
export const FAILURE_METADATA = 'FAILURE_METADATA'
export const REQUEST_THRESHOLDS = 'REQUEST_THRESHOLDS'
export const RECEIVE_THRESHOLDS = 'RECEIVE_THRESHOLDS'
export const FAILURE_THRESHOLDS = 'FAILURE_THRESHOLDS'

// data.govt.nz datasets
const metadataBaseURL = 'https://catalogue.data.govt.nz/api/3/action/datastore_search'

function requestSchema() {
  return {
    type: REQUEST_SCHEMA
  }
}

function receiveSchema(payload) {
  return {
    type: RECEIVE_SCHEMA,
    payload
  }
}

function failureSchema() {
  return {
    type: FAILURE_SCHEMA
  }
}

function requestEligibility(payload) {
  return {
    type: REQUEST_ELIGIBILITY,
    payload
  }
}

function receiveEligibility(payload) {
  return {
    type: RECEIVE_ELIGIBILITY,
    payload
  }
}

function failureEligibility() {
  return {
    type: FAILURE_ELIGIBILITY
  }
}

function requestMetadata() {
  return {
    type: REQUEST_METADATA
  }
}

function receiveMetadata(payload) {
  return {
    type: RECEIVE_METADATA,
    payload
  }
}

function failureMetadata() {
  return {
    type: FAILURE_METADATA
  }
}

function requestThresholds() {
  return {
    type: REQUEST_THRESHOLDS
  }
}

function receiveThresholds(payload) {
  return {
    type: RECEIVE_THRESHOLDS,
    payload
  }
}

function failureThresholds() {
  return {
    type: FAILURE_THRESHOLDS
  }
}

export function fetchSchema() {
  return dispatch => {
    dispatch(requestSchema())
    return fetchWithRetry(ENTITLEMENTS_API + '/variables', {
      retries: 3,
      retryDelay: 500,
      method: 'GET',
      headers: {}
    })
    .then(checkStatus)
    .then(response => {
      return response.json()
    })
    .then(json => dispatch(receiveSchema(json)))
    .catch(() => dispatch(failureSchema()))
  }
}

export function postToReasoner(body) {
  return dispatch => {
    dispatch(requestEligibility(body))
    return fetchWithRetry(ENTITLEMENTS_API + '/calculate', {
      retries: 3,
      retryDelay: 500,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(checkStatus)
    .then(response => {
      return response.json()
    })
    .then(json => dispatch(receiveEligibility(json)))
    .catch(() => dispatch(failureEligibility()))
  }
}

export function fetchMetadata() {
  return dispatch => {
    dispatch(requestMetadata())
    // id of 'Benefits metadata for Smartstart' resource stored on data.govt
    const resourceId = '9c0cca17-d959-48f4-89e0-8e8b3742c700'

    return fetchWithRetry(`${metadataBaseURL}?resource_id=${resourceId}`, {
      retries: 3,
      retryDelay: 500,
      method: 'GET'
    })
    .then(checkStatus)
    .then(response => {
      return response.json()
    })
    .then(json => dispatch(receiveMetadata(get(json, 'result.records'))))
    .catch(() =>  dispatch(failureMetadata()))
  }
}

export function findAreaByPostCode(postCode) {
  return new Promise((resolve, reject) => {
    // id of 'Accomodation Supplement Post Codes and Areas' resource stored on data.govt
    const resourceId = 'cc6102b1-3d42-4ada-86af-e6ecd4ab6896'

    // currently data.govt strips of leading zeros from the postcode
    const postCodeAsInt = parseInt(postCode, 10)
    fetchWithRetry(`${metadataBaseURL}?resource_id=${resourceId}&q=${postCodeAsInt}`, {
      retries: 3,
      retryDelay: 500,
      method: 'GET'
    })
    .then(checkStatus)
    .then(response => { return response.json() })
    .then(json => {
      const result = get(json, 'result.records') || []
      if (result.length) {
        resolve(result[0]['Area'])
      } else {
        reject()
      }
    })
    .catch(() => reject())
  })
}

export function fetchThresholds() {
  return dispatch => {
    dispatch(requestThresholds())
    // id of 'Benefit income thresholds' resource stored on data.govt
    const resourceId = 'c21fcbdb-05ff-4f1b-9195-3d1c04255106'

    return fetchWithRetry(`${metadataBaseURL}?resource_id=${resourceId}`, {
      retries: 3,
      retryDelay: 500,
      method: 'GET'
    })
    .then(checkStatus)
    .then(response => {
      return response.json()
    })
    .then(json => dispatch(receiveThresholds(get(json, 'result.records'))))
    .catch(() =>  dispatch(failureThresholds()))
  }
}
