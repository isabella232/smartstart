import {
  REQUEST_SCHEMA, RECEIVE_SCHEMA, FAILURE_SCHEMA,
  REQUEST_ELIGIBILITY, RECEIVE_ELIGIBILITY, FAILURE_ELIGIBILITY,
  REQUEST_METADATA, RECEIVE_METADATA, FAILURE_METADATA,
  REQUEST_THRESHOLDS, RECEIVE_THRESHOLDS, FAILURE_THRESHOLDS
} from 'actions/entitlements'

export default function entitlements (state = {
  fetchingSchema: false,
  schema: [],
  fetchingEligibility: false,
  eligibilityRequest: {},
  eligibility: {},
  fetchingMetadata: false,
  metadata: [],
  fetchingThresholds: false,
  thresholds: []
}, action) {
  switch (action.type) {
    case REQUEST_SCHEMA:
      return {
        ...state,
        fetchingSchema: true
      }
    case RECEIVE_SCHEMA:
      return {
        ...state,
        fetchingSchema: false,
        schema: Object.keys(action.payload) // we need just variable keys
      }
    case FAILURE_SCHEMA:
      return {
        ...state,
        fetchingSchema: false
      }
    case REQUEST_ELIGIBILITY:
      return {
        ...state,
        eligibilityRequest: action.payload,
        fetchingEligibility: true
      }
    case RECEIVE_ELIGIBILITY:
      return {
        ...state,
        fetchingEligibility: false,
        eligibility: action.payload
      }
    case FAILURE_ELIGIBILITY:
      return {
        ...state,
        fetchingEligibility: false
      }
    case REQUEST_METADATA:
      return {
        ...state,
        fetchingMetadata: true
      }
    case RECEIVE_METADATA:
      return {
        ...state,
        fetchingMetadata: false,
        metadata: action.payload
      }
    case FAILURE_METADATA:
      return {
        ...state,
        fetchingMetadata: false
      }
    case REQUEST_THRESHOLDS:
      return {
        ...state,
        fetchingThresholds: true
      }
    case RECEIVE_THRESHOLDS:
      return {
        ...state,
        fetchingThresholds: false,
        thresholds: action.payload
      }
    case FAILURE_THRESHOLDS:
      return {
        ...state,
        fetchingThresholds: false
      }
    default:
      return state
  }
}
