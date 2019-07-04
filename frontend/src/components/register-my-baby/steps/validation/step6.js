import check from 'components/form/get-validation'
import schema from '../schemas/step6'
import set from 'lodash/set'
import get from 'lodash/get'
import { invalidCharTest } from '../../validate'
import fetchWithRetry from 'fetch-retry'
import { changeField } from 'actions/birth-registration'
import URLSearchParams from 'url-search-params'
import { REQUIRE_MESSAGE_MYIR_USERNAME, IN_USE_MESSAGE_MYIR_USERNAME } from '../../validation-messages'

const validate = values => {
  let errors = {}

  const detailsStatus = get(values, 'myir.detailsStatus')
  const isReserved = get(values, 'myir.reserveStatus') === 'reserved';

  if (isReserved) {
    return errors
  }

  if (values) {
    check('myir.wanted')(schema, values, errors)

    if (get(values, 'myir.available') && get(values, 'myir.wanted') === 'yes') {
      check('myir.email')(schema, values, errors)
      check('myir.detailsConsent')(schema, values, errors)

      if (get(values, 'myir.detailsConsent') === 'yes') {
        if (detailsStatus === 'valid') {
          checkUsername(schema, values, errors)
          check('myir.usernameStatus')(schema, values, errors)

          if (get(values, 'myir.usernameStatus') === 'available') {
            check('myir.notifyByText')(schema, values, errors)

            if (get(values, 'myir.notifyByText') === 'yes') {
              check('myir.mobile')(schema, values, errors)

              // custom validation for mobile phone
              const exp = /^02\d{7}(\d{1,2})?$/
              const regex = new RegExp(exp) // number should start from 02
              if (!regex.test(get(values, 'myir.mobile'))) {
                set(errors, 'myir.mobile', 'Please enter a valid New Zealand mobile number')
              }
            }
          }
        }
      }
    }
  }

  return errors
}

export default validate

const checkUsername = (schema, values, errors) => {
  check('myir.username')(schema, values, errors)
  const username = get(values, 'myir.username')

  if (username) {
    if (username[0] === ' ' || username.slice(-1) === ' ') {
      set(errors, 'myir.username', 'Cannot begin or end with space')
    }

    if (username[0] === '#') {
      set(errors, 'myir.username', 'Cannot begin with #')
    }
    const forbiddenChars = /[+"\\><;=~\s]/g
    const errorMessage = invalidCharTest(username, forbiddenChars)
    if (errorMessage) {
      set(errors, 'myir.username', errorMessage)
    }
  }
}

export const asyncValidate = (values, dispatch) => {
  let errors = {}
  const detailsStatus = get(values, 'myir.detailsStatus')
  const searchParams = new URLSearchParams({
    'ir-number': get(values, 'myir.irdNumber'),
    'first-name': get(values, 'myir.firstNames'),
    'last-name': get(values, 'myir.lastName'),
    'date-of-birth': get(values, 'myir.dateOfBirth'),
    'user-id': get(values, 'myir.username')
  })
  const url = `${MYIR_ENDPOINT}/birth-registration-api/myir/eservices/myir-logon-reservation?${searchParams.toString()}`

  if (detailsStatus === 'valid') {
    return fetchWithRetry(url, {
      credentials: 'same-origin',
      retries: 3,
      retryDelay: 500
    })
    .then(result => result.json())
    .then(({ errors: serverErrors, terms }) => {
      if (terms) {
        dispatch(changeField('myir.usernameStatus', 'available'))
        dispatch(changeField('myir.termsLink', terms))
      }

      if (serverErrors instanceof Array && serverErrors.length > 0) {
        switch(serverErrors[0].code) {
          case 'ER2260':
            set(errors, 'myir.username', IN_USE_MESSAGE_MYIR_USERNAME)
            break;
          case 'EV1100':
            set(errors, 'myir.username', REQUIRE_MESSAGE_MYIR_USERNAME)
            break;
          default:
            set(errors, 'myir.username', serverErrors[0].message)
        }
        dispatch(changeField('myir.usernameStatus', 'invalid'))
        throw errors
      }
    })
  } else {
    return Promise.resolve()
  }
}
