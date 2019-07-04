import {
  REQUEST_API,
  RECEIVE_API,
  SUPPLEMENTARY_OPEN,
  OPEN_PROFILE,
  CLOSE_PROFILE,
  OPEN_TODO,
  CLOSE_TODO,
  OPEN_NAV,
  CLOSE_NAV,
  CLOSE_ALL_DRAWERS
} from 'actions/timeline'

export default function timeline (state = {
  isFetching: false,
  phases: [],
  supplementary: [],
  about: [],
  navPaneOpen: false,
  profilePaneOpen: false,
  todoPaneOpen: false,
  supplementaryID: null
}, action) {
  switch (action.type) {
    case REQUEST_API:
      return Object.assign({}, state, {
        isFetching: true
      })
    case RECEIVE_API:
      return Object.assign({}, state, {
        isFetching: false,
        phases: action.phases,
        supplementary: action.supplementary,
        about: action.about
      })
    case OPEN_NAV:
      return Object.assign({}, state, {
        navPaneOpen: true,
        profilePaneOpen: false,
        todoPaneOpen: false
      })
    case CLOSE_NAV:
      return Object.assign({}, state, {
        navPaneOpen: false
      })
    case OPEN_PROFILE:
      return Object.assign({}, state, {
        navPaneOpen: false,
        profilePaneOpen: true,
        todoPaneOpen: false
      })
    case CLOSE_PROFILE:
      return Object.assign({}, state, {
        profilePaneOpen: false
      })
    case OPEN_TODO:
      return Object.assign({}, state, {
        navPaneOpen: false,
        profilePaneOpen: false,
        todoPaneOpen: true
      })
    case CLOSE_TODO:
      return Object.assign({}, state, {
        todoPaneOpen: false
      })
    case CLOSE_ALL_DRAWERS:
      return Object.assign({}, state, {
        navPaneOpen: false,
        profilePaneOpen: false,
        todoPaneOpen: false
      })
    case SUPPLEMENTARY_OPEN:
      return Object.assign({}, state, {
        activeSupplementary: action.activeSupplementary
      })
    default:
      return state
  }
}
