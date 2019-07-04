import moment from 'moment'
import get from 'lodash/get'

export const BS_ELIGIBLE_DATE = moment('2018-07-01').toDate()

export const isBestStartEligible = formState => {
  const { child: { birthDate } = {}, bestStart } = formState || {}
  const { expectedDueDate: dueDate, primaryCareGiver: pcg = {} } = bestStart || {}
  const pcgBirthDate = get(formState, `${pcg.type}.dateOfBirth`)

  return (
    isDateEligible(birthDate, dueDate) &&
    isPcgEligible(pcg.type, pcgBirthDate) &&
    isNzResident(pcg) && isTaxResident(pcg)
  )
}

export const isDateEligible = (birthDate, dueDate) => {
  return moment(birthDate).isValid() && moment(birthDate).isSameOrAfter(BS_ELIGIBLE_DATE, 'day') ||
    moment(dueDate).isValid() && moment(dueDate).isSameOrAfter(BS_ELIGIBLE_DATE, 'day')
}

export const isPcgEligible = (type, birthDate) => {
  switch(type) {
    case 'mother':
    case 'father':
      return moment().diff(birthDate, 'years') >= 16
    case 'unknown':
      return false
    default:
      return true
  }
}

export const isNzResident = (pcg) => {
  return pcg.isNewZealandResident === 'yes'
}

export const isTaxResident = (pcg) => {
  // applicant is always tax resident unless they specifically answered
  const { isTaxResident, isChildResident, hasLivedInNZForTwelveMonths, taxResidentWhenBestStartStarts } = pcg || {}
  const isNotTaxResident = isTaxResident === 'no' && isChildResident === 'no' && (hasLivedInNZForTwelveMonths === 'no' || taxResidentWhenBestStartStarts === 'no')
  return !isNotTaxResident
}

export const formatBankAccount = (val) => {
  if (val && val instanceof Array && val.length === 4) {
    const bankNumber = zeroPad(val[0], 2)
    const bankBranch = zeroPad(val[1], 4)
    const accountNumber = zeroPad(val[2], 8)
    const accountSuffix = zeroPad(val[3], 4)
    return `${bankNumber}-${bankBranch}-${accountNumber}-${accountSuffix}`
  }
}

const zeroPad = (num, size) => {
  let padded = num + '' // to ensure it's a string
  while (padded.length < size) padded = "0" + padded;

  return padded;
}

export const MYIR_STATES = {
  SUCCESS: 'success',
  BESTSTART_NO: 'bestStart-no',
  UNAVAILABLE: 'unavailable',
  WFF_CLIENT: 'wff-client',
  UNKNOWN: 'unknown',
  OTHER: 'other',
  INELIGIBLE: 'ineligible',
  MSD_CLIENT: 'msd-client',
  HAS_LOGON: 'has-logon',
  NEW: 'new'
}
