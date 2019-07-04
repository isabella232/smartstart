import { Cookies } from 'react-cookie'
import { checkStatus } from 'utils'
import fetchWithRetry from 'fetch-retry'
import { change, unregisterField } from 'redux-form'
import URLSearchParams from 'url-search-params' // polyfill
import { SubmissionError } from 'redux-form'
import set from 'lodash/set'
import { INVALID_MESSAGE_MYIR_RESERVE, NO_LONGER_AVAILABLE_MESSAGE_MYIR_RESERVE } from 'components/register-my-baby/validation-messages'

const cookies = new Cookies()
export const REQUEST_BIRTH_FACILITIES = 'REQUEST_BIRTH_FACILITIES'
export const RECEIVE_BIRTH_FACILITIES = 'RECEIVE_BIRTH_FACILITIES'
export const FAILURE_BIRTH_FACILITIES = 'FAILURE_BIRTH_FACILITIES'
export const REQUEST_COUNTRIES = 'REQUEST_COUNTRIES'
export const RECEIVE_COUNTRIES = 'RECEIVE_COUNTRIES'
export const FAILURE_COUNTRIES = 'FAILURE_COUNTRIES'

export const REQUEST_BRO_DATA = 'REQUEST_BRO_DATA'
export const RECEIVE_BRO_DATA = 'RECEIVE_BRO_DATA'
export const FAILURE_BRO_DATA = 'FAILURE_BRO_DATA'

export const SET_PCG_DETAILS = 'SET_PCG_DETAILS'

function requestBirthFacilities() {
  return {
    type: REQUEST_BIRTH_FACILITIES
  }
}

function receiveBirthFacilities(payload) {
  return {
    type: RECEIVE_BIRTH_FACILITIES,
    payload
  }
}

function failureBirthFacilities() {
  return {
    type: FAILURE_BIRTH_FACILITIES
  }
}

function requestCountries() {
  return {
    type: REQUEST_COUNTRIES
  }
}

function receiveCountries(payload) {
  return {
    type: RECEIVE_COUNTRIES,
    payload
  }
}

function failureCountries() {
  return {
    type: FAILURE_COUNTRIES
  }
}

function requestBroData() {
  return {
    type: REQUEST_BRO_DATA
  }
}

function receiveBroData(payload) {
  return {
    type: RECEIVE_BRO_DATA,
    payload
  }
}

function failureBroData() {
  return {
    type: FAILURE_BRO_DATA
  }
}

export function setPcgDetails(payload) {
  return {
    type: SET_PCG_DETAILS,
    payload
  }
}

export function fetchBirthFacilities() {
  return dispatch => {
    dispatch(requestBirthFacilities())
    return fetchWithRetry('/birth-registration-api/ReferenceData/birth-facilities', {
      credentials: 'same-origin',
      retries: 3,
      retryDelay: 500
    })
    .then(checkStatus)
    .then(response => response.json())
    .then(json => dispatch(receiveBirthFacilities(json)))
    .catch(() => dispatch(failureBirthFacilities()))
  }
}

export function fetchCountries() {
  return dispatch => {
    dispatch(requestCountries())
    return fetchWithRetry('/birth-registration-api/ReferenceData/countries', {
      credentials: 'same-origin',
      retries: 3,
      retryDelay: 500
    })
    .then(checkStatus)
    .then(response => response.json())
    .then(json => dispatch(receiveCountries(json)))
    .catch(() => dispatch(failureCountries()))
  }
}

export function fetchBroData() {
  return dispatch => {
    dispatch(requestBroData())

    return fetchWithRetry('/api/bro-form/data/', {
      credentials: 'same-origin',
      retries: 3,
      retryDelay: 500
    })
      .then(checkStatus)
      .then(response => response.json())
      .then(data => {
        dispatch(receiveBroData(data))
        return Promise.resolve(data)
      })
      .catch(() => dispatch(failureBroData()))
  }
}

export function rememberBroData(data) {
  return dispatch => {
    const djangoCsrfToken = cookies.get('csrftoken')

    // update data regardless status of post
    dispatch(receiveBroData(data))

    // the api need a forward slash in the end
    return fetchWithRetry('/api/bro-form/data/', {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFToken': djangoCsrfToken
      },
      credentials: 'same-origin',
      retries: 3,
      retryDelay: 500,
      body: JSON.stringify(data)
    })
    .then(() => Promise.resolve())
  }
}

export const checkMyIRAvailability = () => dispatch => {
  // to check if myIR service is up, we're just checking eligibility service
  // if it doesn't respond with a server error (503 or other)
  // we are assuming the service is up
    Promise.all([
      fetchWithRetry(`${MYIR_ENDPOINT}/birth-registration-api/myir/validation/ping`, { retries: 3, retryDelay: 500 }),
      fetchWithRetry(`${MYIR_ENDPOINT}/birth-registration-api/myir/eservices/ping`, { retries: 3, retryDelay: 500 })
    ])
    .then(responses => {
      const isAvailable = responses[0].ok && responses[1].ok
      dispatch(changeField('myir.available', isAvailable))})
    .catch(() => {
      dispatch(changeField('myir.available', false))
    })
  }

export const changeField = (field, value) => dispatch => {
  dispatch(change('registration', field, value))
}

export const resetField = field => dispatch => {
  dispatch(change('registration', field, null))
  dispatch(unregisterField('registration', field))
}

export const validatePcgDetails = params => dispatch => {
  dispatch(changeField('myir.detailsStatus', 'loading'))

  const searchParams = new URLSearchParams(params)
  const url = `${MYIR_ENDPOINT}/birth-registration-api/myir/validation/validate-ird-name?${searchParams.toString()}`

  return fetchWithRetry(url, {
      retries: 3,
      retryDelay: 500
    })
    .then(response => response.json())
    .then(({ haslogon, errors }) => {
      if (errors && errors instanceof Array && errors.length > 0) {
        if (errors.code >= 500) {
          dispatch(changeField('myir.available', false))
        } else {
          dispatch(changeField('myir.detailsStatus', 'invalid'))
        }
      } else {
        if (haslogon) {
          dispatch(changeField('myir.detailsStatus', 'has-logon'))
        } else {
          dispatch(changeField('myir.detailsStatus', 'valid'))
        }
      }
    })
    .catch(() => dispatch(changeField('myir.detailsStatus', 'invalid')))
}

export const submitMyIRReservation = params => dispatch => {
  // NOTE: reservation errors are here and not in validation
  // because we are sending request after submitting the form
  // and so far there is no way to
  const searchParams = new URLSearchParams(params)
  const url = `${MYIR_ENDPOINT}/birth-registration-api/myir/eservices/myir-logon-reservation?${searchParams.toString()}`

  return fetch(url, { method: 'POST', credentials: 'same-origin'})
    .then(resp => resp.status >= 200 && resp.status <= 300 ? Promise.resolve({}) : resp.json())
    .then(({errors: serverErrors}) => {
      if (serverErrors) {

        let error = {}
        if (serverErrors[0].code === 'ER2260') {
          error = set({}, 'myir.reserveStatus', NO_LONGER_AVAILABLE_MESSAGE_MYIR_RESERVE)
        } else {
          error = set({}, 'myir.reserveStatus', INVALID_MESSAGE_MYIR_RESERVE)
        }
        throw new SubmissionError(error)
      } else {
        // reservation success
        dispatch(changeField('myir.reserveStatus', 'reserved'))
        return Promise.resolve()
      }
    })
}
