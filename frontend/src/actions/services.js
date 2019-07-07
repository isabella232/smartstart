// actions for location based Services
import { checkStatus } from 'utils'

export const REQUEST_SERVICES_API = 'REQUEST_SERVICES_API'
export const RECEIVE_SERVICES_API = 'RECEIVE_SERVICES_API'
export const RECEIVE_SERVICES_API_ERROR = 'RECEIVE_SERVICES_API_ERROR'
export const REQUEST_PROVIDERS_API = 'REQUEST_PROVIDERS_API'
export const RECEIVE_PROVIDERS_API = 'RECEIVE_PROVIDERS_API'
export const RECEIVE_PROVIDERS_API_ERROR = 'RECEIVE_PROVIDERS_API_ERROR'

// Action types

function requestServicesAPI () {
  return {
    type: REQUEST_SERVICES_API
  }
}

function receiveServicesAPI (json) {
  return {
    type: RECEIVE_SERVICES_API,
    data: json
  }
}

function receiveServicesAPIError () {
  return {
    type: RECEIVE_SERVICES_API_ERROR
  }
}

function requestProvidersAPI () {
  return {
    type: REQUEST_PROVIDERS_API
  }
}

function receiveProvidersAPI (json) {
  return {
    type: RECEIVE_PROVIDERS_API,
    data: json
  }
}

function receiveProvidersAPIError () {
  return {
    type: RECEIVE_PROVIDERS_API_ERROR
  }
}

// Action creators

export function fetchServicesDirectory () {
  return dispatch => {
    dispatch(requestServicesAPI())
    return fetch('/api/service-locations/categories/')
      .then(checkStatus)
      .then(response => response.json())
      .then(json => dispatch(receiveServicesAPI(json)))
      .catch(() => {
        dispatch(receiveServicesAPIError())
      })
  }
}

export function fetchProviders (categoryId) {
  return dispatch => {
    dispatch(requestProvidersAPI())
    return fetch('/api/service-locations/' + categoryId + '/')
      .then(checkStatus)
      .then(response => response.json())
      .then(json => {
        dispatch(receiveProvidersAPI(json))
        return Promise.resolve()
      })
      .catch(() => {
        dispatch(receiveProvidersAPIError())
        return Promise.reject()
      })
  }
}
