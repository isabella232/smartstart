import moment from 'moment'
import uniq from 'lodash/uniq'
import { validateIrdNumber, validateMsdNumber, validateBankAccountNumber } from './modulus-11'
import { requiredWithMessage, numberWithMessage } from 'components/form/validators'
import {
  REQUIRE_MESSAGE,
  REQUIRE_DECLARATION,
  INVALID_EMAIL_MESSAGE,
  INVALID_NUMBER_MESSAGE,
  INVALID_CHAR_MESSAGE,
  INVALID_DATE_MESSAGE,
  INVALID_IRD_MESSAGE,
  INVALID_MSD_MESSAGE,
  INVALID_BANK_ACCOUNT, INVALID_BANK_ACCOUNT_BRANCH, INVALID_BANK_ACCOUNT_FORMAT,
  INVALID_BANK_ACCOUNT_NUMBER, INVALID_BANK_ACCOUNT_BANK_NUMBER, INVALID_BANK_ACCOUNT_SUFFIX,
  FUTURE_DATE_MESSAGE,
  MIN_AGE_MESSAGE,
  MAX_AGE_MESSAGE
} from './validation-messages'

export const required = requiredWithMessage(REQUIRE_MESSAGE)
export const number = numberWithMessage(INVALID_NUMBER_MESSAGE)

export const requiredTrue = value => {
  if(!value){
    return REQUIRE_DECLARATION
  }
}

export const requiredTrueMSD = value => {
  if(!value){
    return REQUIRE_MESSAGE
  }
}

export const email = value =>
  value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value) ?
  INVALID_EMAIL_MESSAGE : undefined

const invalidAlphaRegex = /[^a-zA-Z\-'ÀÁÂÃÄÅÇÈÉÊÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸàáâãäåçèéêëìíîïñòóðõöùúûüýÿĀāĒēĪīŌōŪū\s]/g
const invalidCharStrictRegex = /[^a-zA-Z0-9\-/'ÀÁÂÃÄÅÇÈÉÊÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸàáâãäåçèéêëìíîïñòóðõöùúûüýÿĀāĒēĪīŌōŪū\s]/g
const invalidCharRelaxRegex = /[~!@#$%^&*()+={}\[\]|:;<>]/g
const invalidPhoneNumberRegex = /[^0-9\s]/g
export const invalidCharTest = (value, regex) => {
  const invalidMatches = value ? value.match(regex) : []

  if (invalidMatches && invalidMatches.length) {
    return INVALID_CHAR_MESSAGE.replace('{invalid_matches}',
      uniq(invalidMatches)
      .map(
        // there are some quirks around replacing with a text contains `$` in it
        // we need to use the pattern "$$" to correctly insert a "$"
        // please refer here for more detail:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
        c => c === '$' ? `'$$'` : `'${c}'`
      )
      .join(', ')
    )
  }
}
export const validAlpha = value => invalidCharTest(value, invalidAlphaRegex)
export const validCharStrict = value => invalidCharTest(value, invalidCharStrictRegex)
export const validCharRelax = value => invalidCharTest(value, invalidCharRelaxRegex)
export const validPhoneNumber = value => invalidCharTest(value, invalidPhoneNumberRegex)

export const validDate = value => {
  if (!value) {
    return
  }

  if (typeof value === 'string') {
    value = moment(value)
  }

  if (!value.isValid()) {
    return INVALID_DATE_MESSAGE
  } else if (value.isAfter(moment())) {
    return FUTURE_DATE_MESSAGE
  }
}

export const validFutureDate = value => {
  if (!value) {
    return
  }

  if (typeof value === 'string') {
    value = moment(value)
  }

  if (!value.isValid()) {
    return INVALID_DATE_MESSAGE
  }
}

export const validBankAccount = bankAccountArray => {
  if (!bankAccountArray || !(bankAccountArray instanceof Array) || bankAccountArray.length < 4) {
    // something wrong with a data, but don't return any error
    return
  }

  const bankAccountString = bankAccountArray.join('')

  //  BELOW ARE DIFFERENT BANK ACCOUNT CHECKS

  // EXIST
  if (!bankAccountString) {
    return REQUIRE_MESSAGE
  }
  // DIGITS ONLY
  const numbersOnlyRegex = new RegExp(/^\d+$/)
  const isNumbersOnly = numbersOnlyRegex.test(bankAccountString)

  if (!isNumbersOnly) {
    return INVALID_BANK_ACCOUNT_FORMAT
  }

  // BANK NUMBER
  if (bankAccountArray[0].length < 2) {
    return INVALID_BANK_ACCOUNT_BANK_NUMBER
  }

  // BANK BRANCH
  if (bankAccountArray[1].length < 4) {
    return INVALID_BANK_ACCOUNT_BRANCH
  }

  // ACCOUNT NUMBER
  if (bankAccountArray[2].length < 6) {
    return INVALID_BANK_ACCOUNT_NUMBER
  }

  // ACCOUNT SUFFIX
  if (bankAccountArray[3].length < 2) {
    return INVALID_BANK_ACCOUNT_SUFFIX
  }

  // MODULUS 11
  if(!validateBankAccountNumber(bankAccountString)) {
    return INVALID_BANK_ACCOUNT
  }
}

export const validIrd = value => {
  if (!value) {
    return
  }

  if (!validateIrdNumber(value)) {
    return INVALID_IRD_MESSAGE
  }
}

export const validMsd = value => {
  if (!value) {
    return
  }

  if (!validateMsdNumber(value)) {
    return INVALID_MSD_MESSAGE
  }
}

export const olderThan = minAge => value => {
  const dob = moment(value)

  if (dob.isValid()) {
    const age = moment().diff(dob, 'years')

    if (age < minAge) {
      return MIN_AGE_MESSAGE.replace('{min_age}', minAge)
    }
  }
}

export const youngerThan = maxAge => value => {
  const dob = moment(value)

  if (dob.isValid()) {
    const age = moment().diff(dob, 'years')

    if (age > maxAge) {
      return MAX_AGE_MESSAGE.replace('{max_age}', maxAge)
    }
  }
}
